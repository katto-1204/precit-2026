import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { QuestionStemRenderer } from '@/components/exam/QuestionStemRenderer';
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
import { logStudySession } from '@/db/backup';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import {
  BLUEPRINT_2026,
  QUESTION_TYPE_LABELS,
  type Difficulty,
  type DomainId,
  type QuestionType,
} from '@/domain/blueprint2026';
import {
  ERROR_CATEGORY_REMEDIATION,
  updateTopicMastery,
} from '@/domain/learningEngine';
import type {
  ErrorCategory,
  ExamAttempt,
  Question,
  QuestionResponse,
} from '@/domain/schemas';
import { scoreExamAttempt } from '@/domain/scoringEngine';
import { SYLLABUS_2026_TOPICS, getTopicById } from '@/domain/syllabus2026';
import { formatPercent } from '@/lib/utils';

type PracticePreset =
  | 'guided'
  | 'weakness'
  | 'timed_section'
  | 'bootcamp'
  | 'mistakes'
  | 'random';

const SOURCE_LABELS: Record<Question['sourceClassification'], string> = {
  official_sample: 'Official Published Sample',
  licensed_import: 'Licensed / Imported Material',
  original_practice: 'Original Practice Question',
  ai_draft_pending: 'AI Draft — Pending Validation',
};

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function PracticeHubPage() {
  const [searchParams] = useSearchParams();
  const paramDomain = searchParams.get('domain') as DomainId | null;
  const paramTopic = searchParams.get('topic') ?? 'ALL';
  const paramMode = (searchParams.get('mode') as PracticePreset | null) ?? 'guided';

  const allQuestions = useLiveQuery(() => db.questions.toArray(), []) ?? [];
  const topicMastery = useLiveQuery(() => db.topicMastery.toArray(), []) ?? [];
  const historicalResponses = useLiveQuery(() => db.responses.toArray(), []) ?? [];
  const profile = useLiveQuery(() => db.profiles.get('primary'), []);

  // Hub Filter State
  const [preset, setPreset] = useState<PracticePreset>(paramMode);
  const [domainFilter, setDomainFilter] = useState<DomainId | 'ALL'>(
    paramDomain && ['M1', 'M2', 'M3', 'M4'].includes(paramDomain) ? paramDomain : 'ALL',
  );
  const [topicFilter, setTopicFilter] = useState<string>(paramTopic);
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'ALL'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'ALL'>('ALL');
  const [timedEnabled, setTimedEnabled] = useState(paramMode === 'timed_section');
  const [questionLimit, setQuestionLimit] = useState<number>(10);

  // Active Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responsesByQid, setResponsesByQid] = useState<Record<string, QuestionResponse>>({});
  const [revealedQids, setRevealedQids] = useState<Record<string, boolean>>({});
  const [sessionFinished, setSessionFinished] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [useKoreanLimit, setUseKoreanLimit] = useState(false);

  // Derive previously wrong question IDs from Dexie
  const wrongQuestionIds = useMemo(() => {
    const qMap = new Map(allQuestions.map((q) => [q.id, q]));
    const latestByQid = new Map<string, QuestionResponse>();
    for (const r of historicalResponses) {
      const prev = latestByQid.get(r.questionId);
      if (!prev || r.updatedAt > prev.updatedAt) {
        latestByQid.set(r.questionId, r);
      }
    }
    const missed = new Set<string>();
    for (const [qid, res] of latestByQid.entries()) {
      const q = qMap.get(qid);
      if (!q) continue;
      if (
        res.evaluationStatus !== 'pending_evaluation' &&
        res.earnedPoints < q.pointValue * 0.6
      ) {
        missed.add(qid);
      }
    }
    return missed;
  }, [allQuestions, historicalResponses]);

  const weakTopicIds = useMemo(
    () =>
      new Set(
        topicMastery
          .filter((m) => m.state === 'needs_foundation' || m.state === 'developing')
          .map((m) => m.topicId),
      ),
    [topicMastery],
  );

  // Filtered candidate questions
  const matchingQuestions = useMemo(() => {
    let list = [...allQuestions];

    if (preset === 'weakness') {
      list = list.filter((q) => weakTopicIds.has(q.topicId) || q.domain === 'M3' || q.questionType === 'integrated_performance');
    } else if (preset === 'bootcamp') {
      list = list.filter((q) => q.questionType !== 'mcq');
    } else if (preset === 'mistakes') {
      list = list.filter((q) => wrongQuestionIds.has(q.id));
    }

    if (domainFilter !== 'ALL') {
      list = list.filter((q) => q.domain === domainFilter);
    }
    if (topicFilter !== 'ALL') {
      list = list.filter((q) => q.topicId === topicFilter);
    }
    if (typeFilter !== 'ALL') {
      list = list.filter((q) => q.questionType === typeFilter);
    }
    if (difficultyFilter !== 'ALL') {
      list = list.filter((q) => q.difficulty === difficultyFilter);
    }

    return list;
  }, [
    allQuestions,
    preset,
    weakTopicIds,
    wrongQuestionIds,
    domainFilter,
    topicFilter,
    typeFilter,
    difficultyFilter,
  ]);

  // Countdown Timer in Timed Mode
  useEffect(() => {
    if (!sessionId || sessionFinished || remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      void finishSession();
      return;
    }
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionFinished, remainingSeconds]);

  function applyPreset(nextPreset: PracticePreset) {
    setPreset(nextPreset);
    if (nextPreset === 'timed_section') {
      setTimedEnabled(true);
      if (domainFilter === 'ALL') setDomainFilter('M3');
    } else if (nextPreset === 'bootcamp') {
      setTimedEnabled(false);
      setTypeFilter('ALL');
    } else {
      setTimedEnabled(false);
    }
  }

  async function startSession(customList?: Question[]) {
    const pool = customList ?? matchingQuestions;
    if (pool.length === 0) return;

    const ordered =
      preset === 'random'
        ? [...pool].sort(() => Math.random() - 0.5)
        : [...pool];
    const selected = ordered.slice(0, Math.min(questionLimit, ordered.length));
    const newId = `practice-${Date.now()}`;
    const totalEstSeconds = selected.reduce((sum, q) => sum + q.estimatedSeconds, 0);

    const attempt: ExamAttempt = {
      id: newId,
      title: `Practice — ${preset.replace('_', ' ').toUpperCase()}${domainFilter !== 'ALL' ? ` (${domainFilter})` : ''}`,
      mode:
        preset === 'timed_section'
          ? 'timed_section'
          : preset === 'weakness'
            ? 'weakness_training'
            : preset === 'bootcamp'
              ? 'performance_bootcamp'
              : preset === 'mistakes'
                ? 'mistake_review'
                : 'guided_practice',
      domainFilter: domainFilter === 'ALL' ? undefined : domainFilter,
      status: 'in_progress',
      questionIds: selected.map((q) => q.id),
      startedAt: new Date().toISOString(),
      durationSeconds: timedEnabled ? totalEstSeconds : 0,
      currentQuestionIndex: 0,
      evaluatedPoints: 0,
      pendingPoints: 0,
      maxPoints: selected.reduce((s, q) => s + q.pointValue, 0),
      rawCorrectCount: 0,
      rawEvaluatedCount: 0,
      blueprintVerified: false,
    };

    await db.examAttempts.put(attempt);

    setSessionId(newId);
    setSessionQuestions(selected);
    setCurrentIdx(0);
    setResponsesByQid({});
    setRevealedQids({});
    setSessionFinished(false);
    setRemainingSeconds(timedEnabled ? totalEstSeconds : null);
    setQuestionStartedAt(Date.now());
  }

  const currentQuestion = sessionQuestions[currentIdx] ?? null;
  const currentResponse = currentQuestion ? responsesByQid[currentQuestion.id] : undefined;
  const isCurrentRevealed = currentQuestion ? Boolean(revealedQids[currentQuestion.id]) : false;
  const activeCharLimit = useKoreanLimit
    ? BLUEPRINT_2026.descriptiveKoreanCharLimit
    : (profile?.descriptiveCharLimit ?? BLUEPRINT_2026.descriptiveEnglishDefaultCharLimit);

  function buildOrUpdateResponse(
    q: Question,
    patch: Partial<QuestionResponse>,
  ): QuestionResponse {
    const elapsed = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
    const existing = responsesByQid[q.id];
    const next: QuestionResponse = {
      id: existing?.id ?? `${sessionId}-${q.id}`,
      attemptId: sessionId ?? 'local',
      questionId: q.id,
      isFlagged: existing?.isFlagged ?? false,
      timeSpentSeconds: (existing?.timeSpentSeconds ?? 0) + elapsed,
      evaluationStatus: existing?.evaluationStatus ?? 'unanswered',
      earnedPoints: existing?.earnedPoints ?? 0,
      selectedOptionId: existing?.selectedOptionId,
      textAnswer: existing?.textAnswer,
      codeAnswer: existing?.codeAnswer,
      rubricScores: existing?.rubricScores,
      errorCategory: existing?.errorCategory,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setResponsesByQid((prev) => ({ ...prev, [q.id]: next }));
    void db.responses.put(next);
    return next;
  }

  async function applyMasteryUpdate(q: Question, earned: number, elapsedSec: number) {
    const existingMastery = await db.topicMastery.get(q.topicId);
    if (!existingMastery) return;
    const updated = updateTopicMastery({
      current: existingMastery,
      earnedPoints: earned,
      maxPoints: q.pointValue,
      difficulty: q.difficulty,
      questionType: q.questionType,
      responseTimeSeconds: elapsedSec,
      estimatedSeconds: q.estimatedSeconds,
    });
    await db.topicMastery.put(updated);
  }

  async function handleSelectMcq(optionId: 'A' | 'B' | 'C' | 'D') {
    if (!currentQuestion || isCurrentRevealed) return;
    buildOrUpdateResponse(currentQuestion, { selectedOptionId: optionId });
  }

  async function handleCheckMcq() {
    if (!currentQuestion || !currentResponse?.selectedOptionId) return;
    const isCorrect = currentResponse.selectedOptionId === currentQuestion.correctOptionId;
    const earned = isCorrect ? currentQuestion.pointValue : 0;
    const saved = buildOrUpdateResponse(currentQuestion, {
      evaluationStatus: 'auto_graded',
      earnedPoints: earned,
    });
    setRevealedQids((prev) => ({ ...prev, [currentQuestion.id]: true }));
    await applyMasteryUpdate(currentQuestion, earned, saved.timeSpentSeconds);
  }

  async function handleSubmitWritten(keepPending: boolean) {
    if (!currentQuestion) return;
    const text = (currentResponse?.textAnswer ?? '').trim();
    if (!text) {
      // Blank response strictly gets 0 points
      buildOrUpdateResponse(currentQuestion, {
        evaluationStatus: 'unanswered',
        earnedPoints: 0,
      });
      setRevealedQids((prev) => ({ ...prev, [currentQuestion.id]: true }));
      return;
    }

    if (keepPending) {
      buildOrUpdateResponse(currentQuestion, {
        evaluationStatus: 'pending_evaluation',
        earnedPoints: 0,
      });
      setRevealedQids((prev) => ({ ...prev, [currentQuestion.id]: true }));
    } else {
      // Reveal rubric for transparent self-assessment (initially 0 until user checks criteria)
      const initialRubric: Record<string, number> = {};
      for (const c of currentQuestion.rubric ?? []) {
        initialRubric[c.id] = currentResponse?.rubricScores?.[c.id] ?? 0;
      }
      buildOrUpdateResponse(currentQuestion, {
        evaluationStatus: 'pending_evaluation',
        rubricScores: initialRubric,
        earnedPoints: 0,
      });
      setRevealedQids((prev) => ({ ...prev, [currentQuestion.id]: true }));
    }
  }

  async function handleSaveSelfGrade(q: Question, rubricScores: Record<string, number>) {
    const totalEarned = Object.values(rubricScores).reduce((sum, v) => sum + v, 0);
    const clamped = Math.max(0, Math.min(q.pointValue, totalEarned));
    const saved = buildOrUpdateResponse(q, {
      rubricScores,
      earnedPoints: clamped,
      evaluationStatus: 'self_graded',
    });
    await applyMasteryUpdate(q, clamped, saved.timeSpentSeconds);
  }

  async function handleTagError(q: Question, category: ErrorCategory) {
    buildOrUpdateResponse(q, { errorCategory: category });
  }

  function goToQuestion(nextIndex: number) {
    setCurrentIdx(nextIndex);
    setQuestionStartedAt(Date.now());
  }

  async function finishSession() {
    if (!sessionId) return;
    // Ensure any unrevealed MCQs get graded on submission
    const finalResponses: QuestionResponse[] = [];
    for (const q of sessionQuestions) {
      const existing = responsesByQid[q.id];
      if (q.questionType === 'mcq' && existing?.selectedOptionId && existing.evaluationStatus === 'unanswered') {
        const earned = existing.selectedOptionId === q.correctOptionId ? q.pointValue : 0;
        const graded: QuestionResponse = {
          ...existing,
          evaluationStatus: 'auto_graded',
          earnedPoints: earned,
          updatedAt: new Date().toISOString(),
        };
        await db.responses.put(graded);
        await applyMasteryUpdate(q, earned, graded.timeSpentSeconds);
        finalResponses.push(graded);
      } else if (existing) {
        finalResponses.push(existing);
      }
    }

    const report = scoreExamAttempt(sessionQuestions, finalResponses);
    const attempt = await db.examAttempts.get(sessionId);
    if (attempt) {
      await db.examAttempts.put({
        ...attempt,
        status: 'submitted',
        completedAt: new Date().toISOString(),
        evaluatedPoints: report.evaluatedPoints,
        pendingPoints: report.pendingPoints,
        rawCorrectCount: report.rawCorrectCount,
        rawEvaluatedCount: report.rawEvaluatedCount,
      });
    }

    const mins = Math.max(1, Math.round(report.totalTimeSpentSeconds / 60));
    await logStudySession(mins, sessionQuestions.length, `Practice (${preset})`);
    setSessionFinished(true);
  }

  // --- VIEW 1: Session Summary ---
  if (sessionId && sessionFinished) {
    const responseList = sessionQuestions
      .map((q) => responsesByQid[q.id])
      .filter((r): r is QuestionResponse => Boolean(r));
    const report = scoreExamAttempt(sessionQuestions, responseList);
    const missedQuestions = sessionQuestions.filter((q) => {
      const res = report.itemResults.find((ir) => ir.questionId === q.id);
      return res && res.evaluationStatus !== 'pending_evaluation' && res.isCorrect === false;
    });
    const taggedErrors = Array.from(
      new Set(
        responseList
          .map((r) => r.errorCategory)
          .filter((e): e is ErrorCategory => Boolean(e)),
      ),
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="brand">Session Complete</Badge>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Practice Results &amp; Diagnostics</h1>
          </div>
          <div className="flex gap-2">
            {missedQuestions.length > 0 ? (
              <Button variant="primary" size="sm" onClick={() => void startSession(missedQuestions)}>
                <RotateCcw className="h-4 w-4" />
                Retry {missedQuestions.length} Missed Question(s)
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSessionId(null);
                setSessionFinished(false);
              }}
            >
              Back to Practice Hub
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Evaluated Points</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {report.evaluatedPoints} / {report.evaluatedMaxPoints}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Weighted: {formatPercent(report.evaluatedWeightedPercent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Raw Item Accuracy</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {report.rawCorrectCount} / {report.rawEvaluatedCount}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Accuracy: {formatPercent(report.rawItemAccuracyPercent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Pending Evaluation</p>
              <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                {report.pendingPoints} pts
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {report.pendingCount} ungraded written/practical item(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Unanswered</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {report.unansweredCount}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Unfinished tasks strictly score 0 pts
              </p>
            </CardContent>
          </Card>
        </div>

        {taggedErrors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Concrete Remediation Plan by Error Category</CardTitle>
              <CardDescription>
                Targeted follow-up exercises based on the root causes you tagged during this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {taggedErrors.map((cat) => {
                const info = ERROR_CATEGORY_REMEDIATION[cat];
                return (
                  <div key={cat} className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">{info.label}</Badge>
                      <span className="text-xs text-slate-500">{info.description}</span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-800">
                      Next Action: {info.nextExercisePrescription}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Item-by-Item Review</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {sessionQuestions.map((q, idx) => {
              const res = report.itemResults[idx];
              return (
                <div key={q.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <Badge variant="neutral">{q.domain}</Badge>
                      <Badge variant="neutral">{QUESTION_TYPE_LABELS[q.questionType]}</Badge>
                      <span className="text-sm font-semibold text-slate-900">{q.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{q.explanation}</p>
                  </div>
                  <div className="shrink-0 font-mono text-xs font-semibold">
                    {res.evaluationStatus === 'pending_evaluation' ? (
                      <Badge variant="warning">Pending ({q.pointValue} pts)</Badge>
                    ) : (
                      <Badge variant={res.isCorrect ? 'success' : 'danger'}>
                        {res.earnedPoints} / {res.maxPoints} pts
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- VIEW 2: Active Practice Session Runner ---
  if (sessionId && currentQuestion) {
    const progressPct = ((currentIdx + 1) / sessionQuestions.length) * 100;
    const textLength = (currentResponse?.textAnswer ?? '').length;
    const isOverLimit = textLength > activeCharLimit;

    return (
      <div className="space-y-5">
        {/* Session Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSessionId(null);
                setSessionFinished(false);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Exit
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <span className="font-mono text-xs font-semibold text-slate-800">
              Question {currentIdx + 1} / {sessionQuestions.length}
            </span>
            <Badge variant="brand">{currentQuestion.domain}</Badge>
            <Badge variant="neutral">{QUESTION_TYPE_LABELS[currentQuestion.questionType]}</Badge>
            <Badge variant="info">{currentQuestion.pointValue} pts</Badge>
          </div>

          <div className="flex items-center gap-3">
            {remainingSeconds !== null ? (
              <div
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums ${
                  remainingSeconds < 120
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {formatClock(remainingSeconds)}
              </div>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => void finishSession()}>
              Finish &amp; View Summary
            </Button>
          </div>
        </div>

        <Progress value={progressPct} aria-label="Practice session progress" />

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700">
                  {currentQuestion.id}
                </span>
                <Badge variant="neutral">
                  {getTopicById(currentQuestion.topicId)?.title ?? currentQuestion.topicId}
                </Badge>
                <Badge variant="neutral">{currentQuestion.difficulty.toUpperCase()}</Badge>
              </div>
              <Badge variant="neutral">{SOURCE_LABELS[currentQuestion.sourceClassification]}</Badge>
            </div>
            <CardTitle className="mt-2 text-base">{currentQuestion.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
              <QuestionStemRenderer
                questionId={currentQuestion.id}
                prompt={currentQuestion.prompt}
              />
            </div>

            {/* MCQ Interaction */}
            {currentQuestion.questionType === 'mcq' && currentQuestion.options ? (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const selected = currentResponse?.selectedOptionId === opt.id;
                  const isCorrectOpt = opt.id === currentQuestion.correctOptionId;
                  let borderClass = 'border-slate-200 bg-white hover:border-slate-300';
                  if (isCurrentRevealed) {
                    if (isCorrectOpt) borderClass = 'border-emerald-500 bg-emerald-50/70';
                    else if (selected && !isCorrectOpt) borderClass = 'border-red-400 bg-red-50/70';
                  } else if (selected) {
                    borderClass = 'border-brand-600 bg-brand-50/50';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isCurrentRevealed}
                      onClick={() => void handleSelectMcq(opt.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors cursor-pointer disabled:cursor-default ${borderClass}`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          selected
                            ? 'bg-brand-600 text-white'
                            : 'border border-slate-300 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="text-sm text-slate-800">{opt.text}</span>
                    </button>
                  );
                })}

                {!isCurrentRevealed && !timedEnabled ? (
                  <div className="pt-2">
                    <Button
                      disabled={!currentResponse?.selectedOptionId}
                      onClick={() => void handleCheckMcq()}
                    >
                      Check Answer
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Descriptive / Performance Written & Rubric Interaction */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700">
                    Your Structured Response ({currentQuestion.pointValue} pts)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseKoreanLimit((v) => !v)}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Limit: {useKoreanLimit ? '450 Korean Ref' : `${activeCharLimit} chars`} (Switch)
                    </button>
                    <span
                      className={`font-mono tabular-nums ${
                        isOverLimit ? 'font-semibold text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {textLength} / {activeCharLimit} chars
                    </span>
                  </div>
                </div>

                <textarea
                  aria-label="Written answer response"
                  rows={8}
                  value={currentResponse?.textAnswer ?? ''}
                  onChange={(e) =>
                    buildOrUpdateResponse(currentQuestion, { textAnswer: e.target.value })
                  }
                  placeholder="Structure your response clearly against each numbered prompt requirement..."
                  className="w-full rounded-md border border-slate-300 bg-white p-3.5 font-sans text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-brand-600"
                />

                {!isCurrentRevealed ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void handleSubmitWritten(false)}>
                      Submit &amp; Open Rubric Self-Assessment
                    </Button>
                    <Button variant="outline" onClick={() => void handleSubmitWritten(true)}>
                      Submit as Pending Evaluation
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Explanation & Rubric Feedback Panel (Guided Mode after check) */}
            {isCurrentRevealed ? (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                {currentQuestion.questionType === 'mcq' ? (
                  <div className="flex items-center gap-2">
                    {currentResponse?.selectedOptionId === currentQuestion.correctOptionId ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">
                          Correct (+{currentQuestion.pointValue} points)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-semibold text-red-700">
                          Incorrect (0 / {currentQuestion.pointValue} pts) — Correct Answer:{' '}
                          {currentQuestion.correctOptionId}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Model Answer &amp; Transparent Rubric Evaluation
                      </span>
                      <Badge
                        variant={
                          currentResponse?.evaluationStatus === 'self_graded'
                            ? 'success'
                            : currentResponse?.evaluationStatus === 'unanswered'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {currentResponse?.evaluationStatus === 'self_graded'
                          ? `Self-Graded: ${currentResponse.earnedPoints}/${currentQuestion.pointValue} pts`
                          : currentResponse?.evaluationStatus === 'unanswered'
                            ? 'Unanswered (0 pts)'
                            : 'Pending Evaluation (0 pts credited until graded)'}
                      </Badge>
                    </div>

                    {currentQuestion.expectedResponse ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
                        <p className="mb-1 font-semibold text-slate-900">Model Answer Checklist:</p>
                        <p className="whitespace-pre-line">{currentQuestion.expectedResponse}</p>
                      </div>
                    ) : null}

                    {currentQuestion.rubric &&
                    currentResponse?.evaluationStatus !== 'unanswered' ? (
                      <div className="space-y-2.5 rounded-md border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-900">
                          Score Each Criterion Honestly (Partial Credit):
                        </p>
                        {currentQuestion.rubric.map((crit) => {
                          const currentVal = currentResponse?.rubricScores?.[crit.id] ?? 0;
                          return (
                            <div
                              key={crit.id}
                              className="flex flex-col gap-2 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="pr-3">
                                <p className="text-xs font-semibold text-slate-800">
                                  {crit.label}{' '}
                                  <span className="font-mono text-slate-500">
                                    (max {crit.maxPoints} pts)
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-500">{crit.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  aria-label={`Score for ${crit.label}`}
                                  type="range"
                                  min={0}
                                  max={crit.maxPoints}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const nextScores = {
                                      ...(currentResponse?.rubricScores ?? {}),
                                      [crit.id]: Number(e.target.value),
                                    };
                                    void handleSaveSelfGrade(currentQuestion, nextScores);
                                  }}
                                  className="w-28 accent-brand-600"
                                />
                                <span className="w-12 text-right font-mono text-xs font-bold text-slate-900 tabular-nums">
                                  {currentVal}/{crit.maxPoints}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}

                <p className="text-xs leading-relaxed text-slate-700">
                  <strong className="text-slate-900">Explanation:</strong>{' '}
                  {currentQuestion.explanation}
                </p>

                {/* Error Cause Tagging if missed or partial */}
                {(currentResponse?.earnedPoints ?? 0) < currentQuestion.pointValue * 0.6 ? (
                  <div className="border-t border-slate-200 pt-3">
                    <p className="mb-2 text-xs font-semibold text-slate-800">
                      Tag Root Cause (builds your personalized remediation plan):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(ERROR_CATEGORY_REMEDIATION) as ErrorCategory[]).map((cat) => {
                        const active = currentResponse?.errorCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => void handleTagError(currentQuestion, cat)}
                            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                              active
                                ? 'border-brand-600 bg-brand-50 text-brand-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {ERROR_CATEGORY_REMEDIATION[cat].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => goToQuestion(currentIdx - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              {currentIdx < sessionQuestions.length - 1 ? (
                <Button size="sm" onClick={() => goToQuestion(currentIdx + 1)}>
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => void finishSession()}>
                  Finish Practice Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- VIEW 3: Practice Hub Configuration Screen ---
  const presets: {
    id: PracticePreset;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'guided',
      title: 'Guided Practice',
      desc: 'Untimed learning with instant explanations, rubrics, and mistake retry.',
      icon: Sparkles,
    },
    {
      id: 'weakness',
      title: 'Weakness Training',
      desc: 'Targets low-mastery topics, M3 Information Security, and Integrated items.',
      icon: ShieldAlert,
    },
    {
      id: 'timed_section',
      title: 'Timed Section Test',
      desc: 'Practice individual 2026 domains under exam pacing pressure.',
      icon: Clock,
    },
    {
      id: 'bootcamp',
      title: 'Performance Bootcamp',
      desc: 'Focus exclusively on 30-pt Descriptive, 50-pt Practical, and 80-pt Integrated items.',
      icon: Flame,
    },
    {
      id: 'mistakes',
      title: `Mistake Review (${wrongQuestionIds.size})`,
      desc: 'Spaced repetition drill over questions you previously missed.',
      icon: RotateCcw,
    },
    {
      id: 'random',
      title: 'Random Mixed Quiz',
      desc: 'Shuffled cross-domain check matching your active filters.',
      icon: Target,
    },
  ];

  const availableTopics =
    domainFilter === 'ALL'
      ? SYLLABUS_2026_TOPICS
      : SYLLABUS_2026_TOPICS.filter((t) => t.domain === domainFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Practice Hub</h1>
            <Badge variant="brand">{allQuestions.length} Verified Original Items</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Select a study mode and configure domain, syllabus topic, difficulty, or question type. Every graded answer updates your IndexedDB mastery profile.
          </p>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => {
          const Icon = p.icon;
          const active = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-lg border p-4 text-left transition-all cursor-pointer ${
                active
                  ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-slate-500'}`} />
                <span className="text-sm font-semibold text-slate-900">{p.title}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filters & Launch Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Practice Session</CardTitle>
          <CardDescription>
            Matching pool: <strong className="font-mono text-slate-900">{matchingQuestions.length}</strong>{' '}
            question(s) available in local IndexedDB bank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filter-domain" className="mb-1.5 block text-xs font-medium text-slate-700">
                2026 Domain
              </label>
              <select
                id="filter-domain"
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value as DomainId | 'ALL');
                  setTopicFilter('ALL');
                }}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900"
              >
                <option value="ALL">All Domains (M1–M4)</option>
                {BLUEPRINT_2026.domainOrder.map((d) => (
                  <option key={d} value={d}>
                    {d} — {BLUEPRINT_2026.domains[d].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-topic" className="mb-1.5 block text-xs font-medium text-slate-700">
                Syllabus Topic
              </label>
              <select
                id="filter-topic"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900"
              >
                <option value="ALL">All Topics</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-type" className="mb-1.5 block text-xs font-medium text-slate-700">
                Question Type
              </label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as QuestionType | 'ALL')}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900"
              >
                <option value="ALL">All Types</option>
                <option value="mcq">Multiple Choice (5 pts)</option>
                <option value="descriptive">Descriptive (30 pts)</option>
                <option value="standard_performance">Standard Performance (50 pts)</option>
                <option value="integrated_performance">Integrated Performance (80 pts)</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-diff" className="mb-1.5 block text-xs font-medium text-slate-700">
                Difficulty
              </label>
              <select
                id="filter-diff"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | 'ALL')}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900"
              >
                <option value="ALL">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="q-count" className="text-xs font-medium text-slate-700">
                  Items:
                </label>
                <select
                  id="q-count"
                  value={questionLimit}
                  onChange={(e) => setQuestionLimit(Number(e.target.value))}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={75}>All Matching</option>
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timedEnabled}
                  onChange={(e) => setTimedEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                Timed Pacing Mode (hides immediate answers until finish)
              </label>
            </div>

            <Button
              disabled={matchingQuestions.length === 0}
              onClick={() => void startSession()}
            >
              <Play className="h-4 w-4" />
              Start Practice ({Math.min(questionLimit, matchingQuestions.length)} Questions)
            </Button>
          </div>

          {matchingQuestions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                No questions match the current filter combination (for Mistake Review, answer some questions first to populate missed items).
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
