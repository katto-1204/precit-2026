import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Play,
  Printer,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import {
  BLUEPRINT_2026,
  QUESTION_TYPE_LABELS,
  getCompetencyLevel,
  type QuestionType,
} from '@/domain/blueprint2026';
import { VERIFIED_2025_BASELINE } from '@/domain/historicalBaseline';
import {
  ERROR_CATEGORY_REMEDIATION,
  updateTopicMastery,
} from '@/domain/learningEngine';
import type { ErrorCategory, Question, QuestionResponse } from '@/domain/schemas';
import { scoreExamAttempt } from '@/domain/scoringEngine';
import {
  evaluateDiagramGraph,
  type DiagramNodeData,
  type DiagramType,
} from '@/domain/diagramSpecs';
import { gradeCodingSubmission } from '@/lib/codeRunner';
import { gradeSqlSubmission } from '@/lib/sqlRunner';
import { formatDateShort, formatPercent } from '@/lib/utils';
import type { Edge, Node } from '@xyflow/react';

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAttemptParam = searchParams.get('attempt');

  const attempts = useLiveQuery(() => db.examAttempts.toArray(), []) ?? [];
  const allQuestions = useLiveQuery(() => db.questions.toArray(), []) ?? [];
  const allResponses = useLiveQuery(() => db.responses.toArray(), []) ?? [];
  const profile = useLiveQuery(() => db.profiles.get('primary'), []);

  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'incorrect' | 'flagged'>('all');
  const [autoGradingQid, setAutoGradingQid] = useState<string | null>(null);
  const [autoGradeMessages, setAutoGradeMessages] = useState<Record<string, string>>({});

  const submittedAttempts = useMemo(
    () =>
      attempts
        .filter((a) => a.status === 'submitted')
        .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)),
    [attempts],
  );

  const activeAttempt = useMemo(() => {
    if (selectedAttemptParam) {
      const found = submittedAttempts.find((a) => a.id === selectedAttemptParam);
      if (found) return found;
    }
    return submittedAttempts[0] ?? null;
  }, [submittedAttempts, selectedAttemptParam]);

  const questionById = useMemo(
    () => new Map(allQuestions.map((q) => [q.id, q])),
    [allQuestions],
  );

  const attemptQuestions = useMemo(() => {
    if (!activeAttempt) return [];
    return activeAttempt.questionIds
      .map((id) => questionById.get(id))
      .filter((q): q is Question => Boolean(q));
  }, [activeAttempt, questionById]);

  const attemptResponses = useMemo(() => {
    if (!activeAttempt) return [];
    return allResponses.filter((r) => r.attemptId === activeAttempt.id);
  }, [activeAttempt, allResponses]);

  const responseByQid = useMemo(
    () => new Map(attemptResponses.map((r) => [r.questionId, r])),
    [attemptResponses],
  );

  const scoreReport = useMemo(() => {
    if (!activeAttempt || attemptQuestions.length === 0) return null;
    return scoreExamAttempt(attemptQuestions, attemptResponses);
  }, [activeAttempt, attemptQuestions, attemptResponses]);

  async function handleUpdateRubricScore(
    q: Question,
    criterionId: string,
    scoreVal: number,
  ) {
    if (!activeAttempt) return;
    const existing = responseByQid.get(q.id);
    if (!existing) return;

    const nextRubricScores = {
      ...(existing.rubricScores ?? {}),
      [criterionId]: scoreVal,
    };
    const totalEarned = Math.min(
      q.pointValue,
      Object.values(nextRubricScores).reduce((sum, v) => sum + v, 0),
    );

    const updatedResponse: QuestionResponse = {
      ...existing,
      rubricScores: nextRubricScores,
      earnedPoints: totalEarned,
      evaluationStatus: 'self_graded',
      updatedAt: new Date().toISOString(),
    };

    await db.responses.put(updatedResponse);

    // Recompute attempt aggregate totals in Dexie
    const updatedList = attemptResponses.map((r) =>
      r.questionId === q.id ? updatedResponse : r,
    );
    const recomputed = scoreExamAttempt(attemptQuestions, updatedList);
    await db.examAttempts.update(activeAttempt.id, {
      evaluatedPoints: recomputed.evaluatedPoints,
      pendingPoints: recomputed.pendingPoints,
      rawCorrectCount: recomputed.rawCorrectCount,
      rawEvaluatedCount: recomputed.rawEvaluatedCount,
    });

    // Update topic mastery live
    const m = await db.topicMastery.get(q.topicId);
    if (m) {
      await db.topicMastery.put(
        updateTopicMastery({
          current: m,
          earnedPoints: totalEarned,
          maxPoints: q.pointValue,
          difficulty: q.difficulty,
          questionType: q.questionType,
          responseTimeSeconds: existing.timeSpentSeconds,
          estimatedSeconds: q.estimatedSeconds,
        }),
      );
    }
  }

  async function handleTagErrorCategory(q: Question, category: ErrorCategory) {
    const existing = responseByQid.get(q.id);
    if (!existing) return;
    await db.responses.put({
      ...existing,
      errorCategory: category,
      updatedAt: new Date().toISOString(),
    });
  }

  async function persistEvaluatedResponse(
    q: Question,
    existing: QuestionResponse,
    earnedPoints: number,
    evaluationStatus: QuestionResponse['evaluationStatus'],
    note: string,
  ) {
    if (!activeAttempt) return;
    const clamped = Math.max(0, Math.min(q.pointValue, Math.round(earnedPoints)));
    const updated: QuestionResponse = {
      ...existing,
      earnedPoints: clamped,
      evaluationStatus,
      ...(evaluationStatus === 'ai_estimated' ? { aiEstimateNote: note } : {}),
      updatedAt: new Date().toISOString(),
    };
    await db.responses.put(updated);

    const updatedList = attemptResponses.map((r) => (r.questionId === q.id ? updated : r));
    const recomputed = scoreExamAttempt(attemptQuestions, updatedList);
    await db.examAttempts.update(activeAttempt.id, {
      evaluatedPoints: recomputed.evaluatedPoints,
      pendingPoints: recomputed.pendingPoints,
      rawCorrectCount: recomputed.rawCorrectCount,
      rawEvaluatedCount: recomputed.rawEvaluatedCount,
    });

    const m = await db.topicMastery.get(q.topicId);
    if (m) {
      await db.topicMastery.put(
        updateTopicMastery({
          current: m,
          earnedPoints: clamped,
          maxPoints: q.pointValue,
          difficulty: q.difficulty,
          questionType: q.questionType,
          responseTimeSeconds: existing.timeSpentSeconds,
          estimatedSeconds: q.estimatedSeconds,
        }),
      );
    }
    setAutoGradeMessages((prev) => ({ ...prev, [q.id]: note }));
  }

  async function handleAutoGradePractical(q: Question) {
    const existing = responseByQid.get(q.id);
    if (!existing) return;
    setAutoGradingQid(q.id);
    try {
      if (q.practicalSubtype === 'sql') {
        const schemaSql = typeof q.scenarioData?.schemaSql === 'string' ? q.scenarioData.schemaSql : '';
        const expectedSql = q.expectedResponse ?? '';
        const userSql = existing.codeAnswer ?? existing.textAnswer ?? '';
        if (!userSql.trim()) {
          setAutoGradeMessages((p) => ({ ...p, [q.id]: 'Blank SQL submission receives 0 points.' }));
          return;
        }
        const grade = await gradeSqlSubmission(schemaSql, userSql, expectedSql, true, q.pointValue);
        await persistEvaluatedResponse(q, existing, grade.earnedPoints, 'auto_graded', grade.feedback);
      } else if (q.practicalSubtype === 'coding') {
        const userCode = existing.codeAnswer ?? existing.textAnswer ?? '';
        if (!userCode.trim()) {
          setAutoGradeMessages((p) => ({ ...p, [q.id]: 'Blank code submission receives 0 points.' }));
          return;
        }
        const tests = (q.sampleTestCases ?? []).map((t) => ({
          id: t.id,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: t.isHidden,
          points: t.points,
          description: t.description ?? 'Test case',
        }));
        const summary = await gradeCodingSubmission('python', userCode, tests);
        if (summary.runtimeUnavailable) {
          setAutoGradeMessages((p) => ({
            ...p,
            [q.id]: summary.errorMessage ?? 'Python worker unavailable; grade manually with rubric below.',
          }));
          return;
        }
        await persistEvaluatedResponse(
          q,
          existing,
          summary.earnedPoints,
          'auto_graded',
          `Pyodide Auto-Grader: Passed ${summary.passedCount}/${summary.totalCount} test cases (${summary.earnedPoints}/${summary.maxPoints} pts).`,
        );
      } else if (q.practicalSubtype === 'diagram') {
        if (!existing.diagramJson) {
          setAutoGradeMessages((p) => ({ ...p, [q.id]: 'No diagram graph artifact saved; score 0 pts.' }));
          return;
        }
        const parsed = JSON.parse(existing.diagramJson) as {
          diagramType?: DiagramType;
          nodes?: Node<DiagramNodeData>[];
          edges?: Edge[];
        };
        const dType = parsed.diagramType ?? (q.scenarioData?.diagramType as DiagramType) ?? 'uml_activity';
        const evalRes = evaluateDiagramGraph(dType, parsed.nodes ?? [], parsed.edges ?? [], q.pointValue);
        await persistEvaluatedResponse(
          q,
          existing,
          evalRes.earnedPoints,
          'auto_graded',
          `Structural Graph Grader: ${evalRes.scorePercent}% match (${evalRes.earnedPoints}/${q.pointValue} pts). ${evalRes.missingChecks.join(' ')}`,
        );
      } else if (q.questionType === 'descriptive') {
        const answerText = existing.textAnswer ?? '';
        if (!answerText.trim()) {
          setAutoGradeMessages((p) => ({ ...p, [q.id]: 'Blank descriptive answer scores 0 pts.' }));
          return;
        }
        try {
          const apiBase = (import.meta.env.VITE_AI_API_BASE as string | undefined) ?? '';
          const res = await fetch(`${apiBase}/api/ai/grade-descriptive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionPrompt: q.prompt,
              rubric: q.rubric ?? [],
              studentAnswer: answerText,
              maxPoints: q.pointValue,
            }),
          });
          const data = (await res.json()) as {
            ok?: boolean;
            estimatedPoints?: number;
            feedback?: string;
            error?: string;
          };
          if (!res.ok || !data.ok) {
            setAutoGradeMessages((p) => ({
              ...p,
              [q.id]: `${data.error ?? 'Gemini backend unavailable.'} Use the transparent rubric sliders below to self-grade.`,
            }));
            return;
          }
          await persistEvaluatedResponse(
            q,
            existing,
            data.estimatedPoints ?? 0,
            'ai_estimated',
            `[AI-Assisted Estimate — Not Official TOPCIT Scoring] ${data.estimatedPoints}/${q.pointValue} pts: ${data.feedback ?? ''}`,
          );
        } catch {
          setAutoGradeMessages((p) => ({
            ...p,
            [q.id]: 'Gemini AI endpoint is not configured or offline. Use the transparent rubric sliders below to self-grade.',
          }));
        }
      }
    } finally {
      setAutoGradingQid(null);
    }
  }

  if (!activeAttempt || !scoreReport) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Results &amp; Performance Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Complete a Practice Hub drill or Full 2026 Mock Examination to unlock weighted scoring, domain radar charts, and rubric evaluation.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <BarChart3 className="h-10 w-10 text-slate-300" />
            <div className="max-w-md space-y-1">
              <h2 className="text-base font-semibold text-slate-900">
                No Submitted 2026 Attempts Yet
              </h2>
              <p className="text-xs text-slate-500">
                Your verified 2025 baseline (197/1,000, Level 2) is tracked on the Dashboard. PrepCIT never fabricates fake mock attempts.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link to="/mock-exam">Launch 2026 Full Mock</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/practice">Open Practice Hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const domainChartData = BLUEPRINT_2026.domainOrder.map((d) => {
    const summary = scoreReport.byDomain[d];
    return {
      domain: d,
      name: BLUEPRINT_2026.domains[d].shortName,
      earned: summary.earnedPoints,
      pending: summary.pendingPoints,
      remaining: Math.max(0, summary.totalMaxPoints - summary.earnedPoints - summary.pendingPoints),
      weightedPct: Math.round(summary.weightedScorePercent),
    };
  });

  const targetScore = profile?.targetScore ?? 450;
  const finalLevel =
    scoreReport.finalWeightedScoreOutOf1000 !== null
      ? getCompetencyLevel(scoreReport.finalWeightedScoreOutOf1000)
      : null;

  const filteredItems = attemptQuestions
    .map((q, idx) => ({ q, idx, result: scoreReport.itemResults[idx], response: responseByQid.get(q.id) }))
    .filter((entry) => {
      if (reviewFilter === 'pending') return entry.result.evaluationStatus === 'pending_evaluation';
      if (reviewFilter === 'incorrect')
        return (
          entry.result.evaluationStatus !== 'pending_evaluation' &&
          entry.result.isCorrect === false
        );
      if (reviewFilter === 'flagged') return Boolean(entry.response?.isFlagged);
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Header + Attempt Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Results &amp; Performance Analytics
            </h1>
            {scoreReport.isFullyEvaluated ? (
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                Fully Evaluated
              </Badge>
            ) : (
              <Badge variant="warning">
                <AlertTriangle className="h-3 w-3" />
                {scoreReport.pendingCount} Item(s) Pending Rubric Grading
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Transparent breakdown separating weighted examination score from raw item accuracy and pending manual/rubric evaluations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select submitted attempt"
            value={activeAttempt.id}
            onChange={(e) => setSearchParams({ attempt: e.target.value })}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
          >
            {submittedAttempts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({formatDateShort(a.completedAt ?? a.startedAt)})
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Export / Print Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">
              {scoreReport.finalWeightedScoreOutOf1000 !== null
                ? 'Final Weighted Score (/1,000)'
                : 'Evaluated Score So Far'}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {scoreReport.finalWeightedScoreOutOf1000 ?? scoreReport.evaluatedPoints}
              </span>
              <span className="font-mono text-xs text-slate-500">
                / {scoreReport.finalWeightedScoreOutOf1000 !== null ? 1000 : scoreReport.evaluatedMaxPoints} pts
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {finalLevel ? (
                <span className="font-semibold text-brand-700">{finalLevel.label}</span>
              ) : (
                <span>
                  Weighted on evaluated: {formatPercent(scoreReport.evaluatedWeightedPercent)}
                </span>
              )}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              2025 Baseline: {VERIFIED_2025_BASELINE.totalScore} · Target: {targetScore}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Pending Evaluation</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-amber-700 tabular-nums">
                {scoreReport.pendingPoints}
              </span>
              <span className="font-mono text-xs text-slate-500">pts awaiting review</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {scoreReport.pendingCount} submitted written/practical task(s)
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Grade below using rubrics to finalize 1,000-pt score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Raw Item Accuracy</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatPercent(scoreReport.rawItemAccuracyPercent)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600 font-mono tabular-nums">
              {scoreReport.rawCorrectCount} / {scoreReport.rawEvaluatedCount} evaluated items passed
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Unanswered (0 pts): {scoreReport.unansweredCount} item(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Time Efficiency</p>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {Math.max(1, Math.round(scoreReport.totalTimeSpentSeconds / 60))}m
              </span>
              <span className="text-xs text-slate-500">recorded</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 font-mono">
              Avg ~
              {scoreReport.totalQuestions > 0
                ? Math.round(scoreReport.totalTimeSpentSeconds / scoreReport.totalQuestions)
                : 0}
              s / item
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              2026 Budget: 150m total (~120s avg across 75Q)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts: Domain Points Stacked Bar + Domain Competency Radar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Points Breakdown by 2026 Domain (M1–M4)</CardTitle>
            <CardDescription>
              Separates earned points, pending evaluation points, and unattained points.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <BarChart data={domainChartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="domain" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="earned" name="Earned Pts" stackId="a" fill="#c81e1e" />
                  <Bar dataKey="pending" name="Pending Rubric Pts" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="remaining" name="Missed / Unanswered" stackId="a" fill="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain Competency Shape (Radar)</CardTitle>
            <CardDescription>
              Evaluated weighted percentage across all four 2026 assessment domains.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <RadarChart data={domainChartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Weighted %"
                    dataKey="weightedPct"
                    stroke="#c81e1e"
                    fill="#c81e1e"
                    fillOpacity={0.22}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Type Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Question Type</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-2.5 font-medium">Question Type</th>
                <th className="px-4 py-2.5 font-medium">Earned / Max</th>
                <th className="px-4 py-2.5 font-medium">Pending Pts</th>
                <th className="px-4 py-2.5 font-medium">Items Passed / Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(['mcq', 'descriptive', 'standard_performance', 'integrated_performance'] as QuestionType[]).map(
                (qt) => {
                  const row = scoreReport.byType[qt];
                  if (row.totalItems === 0) return null;
                  return (
                    <tr key={qt}>
                      <td className="px-5 py-2.5 font-sans font-medium text-slate-900">
                        {QUESTION_TYPE_LABELS[qt]}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.earnedPoints} / {row.totalMaxPoints}
                      </td>
                      <td className="px-4 py-2.5 text-amber-700">{row.pendingPoints}</td>
                      <td className="px-4 py-2.5">
                        {row.correctItems} / {row.evaluatedItems} (total {row.totalItems})
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Interactive Rubric Grading & Question Review Workbench */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Item Review, Rubric Self-Grading &amp; Error Diagnostics</CardTitle>
              <CardDescription>
                Grade pending descriptive/practical tasks criterion-by-criterion and tag error root causes.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['all', `All (${attemptQuestions.length})`],
                  ['pending', `Pending (${scoreReport.pendingCount})`],
                  ['incorrect', 'Incorrect / Unanswered'],
                  ['flagged', 'Flagged'],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={reviewFilter === key ? 'primary' : 'outline'}
                  onClick={() => setReviewFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="divide-y divide-slate-200 p-0">
          {filteredItems.map(({ q, idx, result, response }) => {
            const isPending = result.evaluationStatus === 'pending_evaluation';
            const isCorrect = result.isCorrect === true;

            return (
              <div key={q.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Q{idx + 1}
                    </span>
                    <Badge variant="brand">{q.domain}</Badge>
                    <Badge variant="neutral">{QUESTION_TYPE_LABELS[q.questionType]}</Badge>
                    <h3 className="text-sm font-semibold text-slate-900">{q.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <Badge variant="warning">Pending ({q.pointValue} pts)</Badge>
                    ) : isCorrect ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" />
                        {result.earnedPoints}/{result.maxPoints} pts
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <XCircle className="h-3 w-3" />
                        {result.earnedPoints}/{result.maxPoints} pts
                      </Badge>
                    )}
                  </div>
                </div>

                {q.questionType === 'mcq' ? (
                  <p className="text-xs text-slate-600">
                    Your choice:{' '}
                    <strong className="font-mono text-slate-900">
                      {response?.selectedOptionId ?? 'None'}
                    </strong>{' '}
                    · Correct answer:{' '}
                    <strong className="font-mono text-emerald-700">{q.correctOptionId}</strong>
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-700">Your Submitted Response:</p>
                        {result.evaluationStatus !== 'unanswered' &&
                        (q.practicalSubtype === 'sql' ||
                          q.practicalSubtype === 'coding' ||
                          q.practicalSubtype === 'diagram' ||
                          q.questionType === 'descriptive') ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={autoGradingQid === q.id}
                            onClick={() => void handleAutoGradePractical(q)}
                          >
                            {q.questionType === 'descriptive' ? (
                              <Bot className="h-3.5 w-3.5 text-brand-600" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-brand-600" />
                            )}
                            {autoGradingQid === q.id
                              ? 'Evaluating...'
                              : q.questionType === 'descriptive'
                                ? 'Request AI Rubric Estimate'
                                : `Auto-Grade ${q.practicalSubtype?.toUpperCase()}`}
                          </Button>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap font-mono text-slate-800">
                        {response?.codeAnswer?.trim() ||
                          response?.textAnswer?.trim() ||
                          (response?.diagramJson ? '[Interactive Diagram Graph Saved]' : '') ||
                          '(Blank — unfinished task automatically scored 0 points)'}
                      </p>
                      {autoGradeMessages[q.id] || response?.aiEstimateNote ? (
                        <p className="mt-2 rounded border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900">
                          {autoGradeMessages[q.id] ?? response?.aiEstimateNote}
                        </p>
                      ) : null}
                    </div>

                    {q.expectedResponse ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                        <p className="mb-1 font-semibold text-emerald-900">Model Answer Checklist:</p>
                        <p className="whitespace-pre-line text-slate-800">{q.expectedResponse}</p>
                      </div>
                    ) : null}

                    {q.rubric && result.evaluationStatus !== 'unanswered' ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3.5 space-y-2.5">
                        <p className="text-xs font-semibold text-slate-900">
                          Rubric Partial-Credit Evaluation (updates final score live):
                        </p>
                        {q.rubric.map((crit) => {
                          const val = response?.rubricScores?.[crit.id] ?? 0;
                          return (
                            <div
                              key={crit.id}
                              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-xs font-medium text-slate-800">
                                  {crit.label} (max {crit.maxPoints} pts)
                                </p>
                                <p className="text-[11px] text-slate-500">{crit.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  aria-label={`Rubric ${crit.label} for ${q.id}`}
                                  type="range"
                                  min={0}
                                  max={crit.maxPoints}
                                  value={val}
                                  onChange={(e) =>
                                    void handleUpdateRubricScore(q, crit.id, Number(e.target.value))
                                  }
                                  className="w-28 accent-brand-600"
                                />
                                <span className="w-12 text-right font-mono text-xs font-bold tabular-nums">
                                  {val}/{crit.maxPoints}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}

                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">Explanation:</strong> {q.explanation}
                </p>

                {!isCorrect && !isPending && response ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-slate-500 mr-1">
                      Error Cause:
                    </span>
                    {(Object.keys(ERROR_CATEGORY_REMEDIATION) as ErrorCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => void handleTagErrorCategory(q, cat)}
                        className={`rounded border px-2 py-0.5 text-[10px] font-medium cursor-pointer ${
                          response.errorCategory === cat
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {ERROR_CATEGORY_REMEDIATION[cat].label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
