import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import { BLUEPRINT_2026 } from '@/domain/blueprint2026';
import {
  MASTERY_STATE_META,
  generateDailyRecommendations,
} from '@/domain/learningEngine';
import { getTopicById } from '@/domain/syllabus2026';
import { formatDateShort } from '@/lib/utils';

export function StudyPlannerPage() {
  const profile = useLiveQuery(() => db.profiles.get('primary'), []);
  const topicMastery = useLiveQuery(() => db.topicMastery.toArray(), []) ?? [];
  const dailyRecs = generateDailyRecommendations(topicMastery, 4);

  const sortedMastery = [...topicMastery].sort(
    (a, b) => a.competencyScore - b.competencyScore,
  );

  const dueCount = topicMastery.filter(
    (m) => new Date(m.nextReviewAt).getTime() <= Date.now(),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Adaptive Study Planner &amp; SM-2 Spaced Repetition
            </h1>
            <Badge variant="brand">{dueCount} Topics Due for Review</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Transparent scheduling driven by 2026 exam domain weights, mastery states, repeat errors, and SM-2 review intervals.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar className="h-4 w-4 text-brand-600" />
          Target Exam: <strong>{formatDateShort(profile?.targetExamDate ?? '')}</strong> · Daily
          Goal: <strong>{profile?.dailyStudyMinutesGoal ?? 60}m</strong>
        </div>
      </div>

      {/* Today's Adaptive Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <CardTitle>Today’s High-ROI Study Queue</CardTitle>
          </div>
          <CardDescription>
            Balances M1–M4 domain point weights with integrated &amp; descriptive tasks so study never pads accuracy with easy MCQs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {dailyRecs.map((rec) => (
            <div key={rec.id} className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant="brand">{rec.domain}</Badge>
                  <Badge variant="neutral">{rec.targetDifficulty.toUpperCase()}</Badge>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {rec.estimatedMinutes}m
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{rec.topicTitle}</h3>
              <p className="mt-1 text-xs text-slate-600">{rec.rationale}</p>
              <div className="mt-3 flex justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link to={rec.route}>
                    Start Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Full 19-Topic SM-2 Mastery Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>All 19 Syllabus Topics — Mastery &amp; Spaced Repetition Schedule</CardTitle>
          <CardDescription>
            Sorted from weakest competency to strongest. Shows transparent ease factor (EF), review interval, and scheduling rationale.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-3 py-2.5 font-medium">Domain Weight</th>
                <th className="px-3 py-2.5 font-medium">Mastery State</th>
                <th className="px-3 py-2.5 font-medium">Competency</th>
                <th className="px-3 py-2.5 font-medium">SM-2 Schedule</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMastery.map((m) => {
                const topic = getTopicById(m.topicId);
                const meta = MASTERY_STATE_META[m.state];
                const domainWeight = BLUEPRINT_2026.domains[m.domain].totalPoints;
                return (
                  <tr key={m.topicId}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        <span className="mr-1.5 font-mono text-brand-700">{topic?.code}</span>
                        {topic?.title ?? m.topicId}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{m.scheduleReason}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-700">
                      {m.domain} ({domainWeight}p)
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                    </td>
                    <td className="px-3 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <Progress value={m.competencyScore} className="h-1.5" />
                        <span className="font-mono text-[11px] font-semibold tabular-nums">
                          {m.competencyScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                      <div>Every {m.intervalDays}d · EF {m.easeFactor}</div>
                      <div className="text-slate-400">Next: {formatDateShort(m.nextReviewAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/practice?domain=${m.domain}&topic=${m.topicId}&mode=guided`}>
                          Drill
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
