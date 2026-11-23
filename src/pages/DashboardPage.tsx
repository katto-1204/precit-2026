import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Plus,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react';
import { DomainMasteryChart, ScoreTrendChart } from '@/components/charts/DashboardCharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { db } from '@/db/database';
import { logStudySession } from '@/db/backup';
import { computeStreakDays } from '@/db/seed';
import { useLiveQuery } from '@/db/useLiveQuery';
import {
  BLUEPRINT_2026,
  QUESTION_TYPE_LABELS,
  getCompetencyLevel,
} from '@/domain/blueprint2026';
import {
  VERIFIED_2025_BASELINE,
  buildWeaknessPriorities,
  getHistoricalEvidenceBy2026Domain,
} from '@/domain/historicalBaseline';
import {
  MASTERY_STATE_META,
  generateDailyRecommendations,
} from '@/domain/learningEngine';
import { formatDateShort, formatPercent } from '@/lib/utils';

export function DashboardPage() {
  const profile = useLiveQuery(() => db.profiles.get('primary'), []);
  const historicalRecords = useLiveQuery(() => db.historicalRecords.toArray(), []) ?? [];
  const topicMastery = useLiveQuery(() => db.topicMastery.toArray(), []) ?? [];
  const examAttempts = useLiveQuery(() => db.examAttempts.toArray(), []) ?? [];
  const studyActivities = useLiveQuery(() => db.studyActivities.toArray(), []) ?? [];

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logMinutes, setLogMinutes] = useState('45');
  const [logQuestions, setLogQuestions] = useState('10');
  const [logMode, setLogMode] = useState('Weakness Study');
  const [logSaving, setLogSaving] = useState(false);

  const baseline =
    historicalRecords.find((r) => r.isVerifiedBaseline) ?? VERIFIED_2025_BASELINE;
  const targetScore = profile?.targetScore ?? 450;
  const targetLevel = getCompetencyLevel(targetScore);
  const baselineLevel = getCompetencyLevel(baseline.totalScore);
  const pointsGap = Math.max(0, targetScore - baseline.totalScore);
  const streakDays = computeStreakDays(studyActivities);
  const totalMinutesLogged = studyActivities.reduce((acc, a) => acc + a.minutesStudied, 0);

  const domainEvidence = getHistoricalEvidenceBy2026Domain(baseline);
  const weaknessPriorities = buildWeaknessPriorities(baseline);
  const dailyRecommendations = generateDailyRecommendations(topicMastery, 4);

  const completed2026Mocks = examAttempts.filter(
    (a) => a.mode === 'full_mock_2026' && a.status === 'submitted',
  );

  const targetExamDate = profile?.targetExamDate ?? new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  const daysToExam = Math.max(
    0,
    Math.ceil((new Date(`${targetExamDate}T00:00:00`).getTime() - Date.now()) / 86_400_000),
  );

  const upcomingMocks = [
    {
      id: 'mock-milestone-1',
      title: '2026 Diagnostic Full Mock #1',
      window: 'Week 2 · Establish 2026-format baseline',
      spec: '75 Questions · 150 Min · 1,000 Pts',
      status: completed2026Mocks.length >= 1 ? 'Completed' : 'Ready in Phase 3',
    },
    {
      id: 'mock-milestone-2',
      title: '2026 Mid-Cycle Full Mock #2',
      window: 'Week 6 · Verify M3 Security & M1 Practical gains',
      spec: '75 Questions · 150 Min · 1,000 Pts',
      status: completed2026Mocks.length >= 2 ? 'Completed' : 'Scheduled',
    },
    {
      id: 'mock-milestone-3',
      title: '2026 Final Readiness Full Mock #3',
      window: `Target window before ${formatDateShort(targetExamDate)}`,
      spec: '75 Questions · 150 Min · Target ≥ Level 3 (400+)',
      status: completed2026Mocks.length >= 3 ? 'Completed' : 'Scheduled',
    },
  ];

  async function handleLogSession(e: React.FormEvent) {
    e.preventDefault();
    const mins = Math.max(1, Number(logMinutes) || 0);
    const qs = Math.max(0, Number(logQuestions) || 0);
    setLogSaving(true);
    try {
      await logStudySession(mins, qs, logMode);
      setLogDialogOpen(false);
    } finally {
      setLogSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Performance &amp; Study Dashboard
            </h1>
            <Badge variant="brand">2026 Blueprint</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Tracking progression from your verified Dec 10, 2025 baseline toward{' '}
            <span className="font-medium text-slate-900">{targetLevel.label}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Log Offline Study
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Study Session</DialogTitle>
                <DialogDescription>
                  Record focused study minutes to update your local IndexedDB streak and daily goal.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLogSession} className="space-y-4">
                <div>
                  <label htmlFor="log-minutes" className="mb-1 block text-xs font-medium text-slate-700">
                    Minutes Studied
                  </label>
                  <Input
                    id="log-minutes"
                    type="number"
                    min={1}
                    max={480}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="log-questions" className="mb-1 block text-xs font-medium text-slate-700">
                    Questions / Problems Reviewed
                  </label>
                  <Input
                    id="log-questions"
                    type="number"
                    min={0}
                    max={300}
                    value={logQuestions}
                    onChange={(e) => setLogQuestions(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="log-mode" className="mb-1 block text-xs font-medium text-slate-700">
                    Focus Area
                  </label>
                  <Input
                    id="log-mode"
                    type="text"
                    value={logMode}
                    onChange={(e) => setLogMode(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setLogDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={logSaving}>
                    {logSaving ? 'Saving...' : 'Save Session'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button asChild size="sm">
            <Link to="/settings">
              <Target className="h-4 w-4" />
              Adjust Target &amp; Records
            </Link>
          </Button>
        </div>
      </div>

      {/* Top KPI Row */}
      <section aria-label="Key Performance Metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Verified 2025 Baseline
              </span>
              <Badge variant="neutral">2025 Format · 65Q</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {baseline.totalScore}
              </span>
              <span className="font-mono text-xs text-slate-500">/ 1,000 pts</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
              <span>{baselineLevel.label}</span>
              <span className="font-mono tabular-nums">
                {baseline.correctItems}/{baseline.totalItems} items (
                {formatPercent((baseline.correctItems / baseline.totalItems) * 100)})
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Exam Date: {formatDateShort(baseline.examDate)} · Weighted 19.7% vs Accuracy 38.5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Target 2026 Score</span>
              <Badge variant="brand">Level {targetLevel.level}</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-brand-600 tabular-nums">
                {targetScore}
              </span>
              <span className="font-mono text-xs text-slate-500">/ 1,000 pts</span>
            </div>
            <Progress
              value={(baseline.totalScore / targetScore) * 100}
              aria-label="Baseline progress toward target score"
              className="mt-3"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gap from 2025: +{pointsGap} pts</span>
              <span>{daysToExam} days to target</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Study Streak</span>
              <Flame className="h-4 w-4 text-brand-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {streakDays}
              </span>
              <span className="text-xs text-slate-500">
                {streakDays === 1 ? 'day active' : 'days active'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Total logged: <span className="font-mono font-medium">{totalMinutesLogged} min</span> ·
              Daily goal: <span className="font-mono">{profile?.dailyStudyMinutesGoal ?? 60}m</span>
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Stored locally in IndexedDB (offline-ready)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">2026 Mock Attempts</span>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {completed2026Mocks.length}
              </span>
              <span className="text-xs text-slate-500">full 75Q simulations</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              2025 Benchmarks: Avg <span className="font-mono">{baseline.examineeAverage}</span> · Top
              30% <span className="font-mono">{baseline.top30Reference}</span> · Top 10%{' '}
              <span className="font-mono">{baseline.top10Reference}</span>
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              No synthetic 2026 score computed from 2025 data
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Integrity Banner: 2025 vs 2026 transparency */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>
          <strong className="font-semibold text-slate-900">Blueprint Mapping Integrity:</strong> Your
          December 10, 2025 result (<span className="font-mono">197/1000</span>, 65 items) is
          preserved strictly as historical diagnostic evidence. In the revised 2026 format (75
          items, 150 min), the old <em>Integrated Competencies</em> area (15/260) maps to 80-point
          Integrated Performance tasks embedded inside <strong>M1, M2, and M3</strong> rather than
          a separate domain.
        </p>
      </div>

      {/* Charts Row: 2026 Domain Mastery + Progression Trend */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Estimated Competency by 2026 Domain (M1–M4)</CardTitle>
                <CardDescription>
                  Seeded from verified 2025 historical priors; updates live as you complete 2026 practice.
                </CardDescription>
              </div>
              <Badge variant="neutral">4 Official Domains</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DomainMasteryChart topicMastery={topicMastery} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BLUEPRINT_2026.domainOrder.map((domainId) => {
                const spec = BLUEPRINT_2026.domains[domainId];
                const ev = domainEvidence[domainId];
                return (
                  <div
                    key={domainId}
                    className="rounded-md border border-slate-200 bg-slate-50/70 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{domainId}</span>
                      <span className="font-mono text-[11px] font-medium text-brand-700">
                        {spec.totalPoints} pts
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-700">
                      {spec.shortName}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {spec.totalQuestions}Q · 2025 prior{' '}
                      <span className="font-mono font-medium">
                        {formatPercent(ev.historicalWeightedPercent)}
                      </span>
                    </p>
                    {ev.includesIntegratedCrossDomain ? (
                      <p className="mt-0.5 text-[10px] text-brand-700">
                        + 80pt Integrated (2025: 5.8%)
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-slate-400">MCQ + Descriptive only</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Score Trend &amp; Benchmark References</CardTitle>
                <CardDescription>
                  Verified 2025 baseline compared against Examinee Average (233.6), Top 30% (413.0), and your Target ({targetScore}).
                </CardDescription>
              </div>
              <Badge variant="info">Target ≥ 400 (L3)</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart
              historicalRecords={historicalRecords}
              examAttempts={examAttempts}
              targetScore={targetScore}
              examineeAverage={baseline.examineeAverage}
              top30Reference={baseline.top30Reference}
            />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">Examinee Avg</p>
                <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {baseline.examineeAverage ?? 233.6}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">Top 30% Ref</p>
                <p className="font-mono text-sm font-semibold text-sky-700 tabular-nums">
                  {baseline.top30Reference ?? 413.0}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">Top 10% Ref</p>
                <p className="font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                  {baseline.top10Reference ?? 568.5}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Lower Grid: Prioritized Weaknesses + Recommended Exercises & Upcoming Mocks */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Weakness Priority Queue (1-7) */}
        <Card className="xl:col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Prioritized Weakness Roadmap (Verified 2025 Diagnostic)</CardTitle>
                <CardDescription>
                  Ordered from highest impact gap to maintenance areas, showing both weighted score % and raw item accuracy.
                </CardDescription>
              </div>
              <Badge variant="danger">
                <ShieldAlert className="h-3 w-3" />7 Areas Ranked
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {weaknessPriorities.map((item) => {
                const itemAccuracy =
                  item.totalItems > 0 ? (item.correctItems / item.totalItems) * 100 : 0;
                const badgeVariant =
                  item.severity === 'critical'
                    ? 'danger'
                    : item.severity === 'high'
                      ? 'warning'
                      : item.severity === 'moderate'
                        ? 'info'
                        : 'success';

                return (
                  <div
                    key={item.historicalAreaId}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 font-mono text-[11px] font-semibold text-white">
                          {item.rank}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                        <Badge variant={badgeVariant}>{item.severity.toUpperCase()}</Badge>
                        {item.targetDomains.map((d) => (
                          <span
                            key={d}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700"
                          >
                            → {d}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600">{item.actionFocus}</p>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {item.earnedPoints}/{item.maxPoints} pts{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({formatPercent(item.scorePercent)})
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        Items: {item.correctItems}/{item.totalItems} ({formatPercent(itemAccuracy)})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Daily Recommendations + Upcoming Mocks */}
        <div className="space-y-6 xl:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended Daily Exercises</CardTitle>
                  <CardDescription>
                    Weighted by weakness &amp; 2026 domain point value — mixes practical, descriptive, and MCQ tasks.
                  </CardDescription>
                </div>
                <Badge variant="brand">Anti-Easy-MCQ</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyRecommendations.map((rec) => {
                const mastery = topicMastery.find((t) => t.topicId === rec.topicId);
                const stateMeta = mastery
                  ? MASTERY_STATE_META[mastery.state]
                  : MASTERY_STATE_META.needs_foundation;

                return (
                  <div
                    key={rec.id}
                    className="rounded-md border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                          {rec.domain}
                        </span>
                        <Badge variant={stateMeta.tone}>{stateMeta.label}</Badge>
                        <Badge variant="neutral">
                          {QUESTION_TYPE_LABELS[rec.targetQuestionType]}
                        </Badge>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {rec.estimatedMinutes}m
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-slate-900">
                      {rec.topicTitle}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{rec.rationale}</p>

                    <div className="mt-3 flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link to={rec.route}>
                          Open Module
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming 2026 Full Mock Schedule</CardTitle>
                  <CardDescription>
                    Aligned to official 75-item, 150-minute, 1,000-point blueprint.
                  </CardDescription>
                </div>
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMocks.map((mock) => (
                <div
                  key={mock.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {mock.status === 'Completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-brand-600" />
                      )}
                      <h3 className="text-xs font-semibold text-slate-900">{mock.title}</h3>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{mock.window}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{mock.spec}</p>
                  </div>
                  <Badge variant={mock.status === 'Completed' ? 'success' : 'neutral'}>
                    {mock.status}
                  </Badge>
                </div>
              ))}

              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link to="/mock-exam">
                  View 2026 Mock Blueprint &amp; Simulator
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
