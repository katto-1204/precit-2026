import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { EmbeddedExamCodeWorkspace } from '@/components/exam/EmbeddedExamCodeWorkspace';
import { QuestionStemRenderer } from '@/components/exam/QuestionStemRenderer';
import { DiagramWorkspace } from '@/components/labs/DiagramWorkspace';
import type { DiagramType } from '@/domain/diagramSpecs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db } from '@/db/database';
import {
  BLUEPRINT_2026,
  QUESTION_TYPE_LABELS,
  type DomainId,
  type QuestionType,
} from '@/domain/blueprint2026';
import type { ExamAttempt, Question, QuestionResponse } from '@/domain/schemas';
import {
  projectQuestionForActiveExam,
  scoreExamAttempt,
} from '@/domain/scoringEngine';
import { updateTopicMastery } from '@/domain/learningEngine';
import { logStudySession } from '@/db/backup';

interface CBTExamRunnerProps {
  attempt: ExamAttempt;
  questions: Question[];
  initialResponses: QuestionResponse[];
  descriptiveCharLimit: number;
  onSubmitted: (attemptId: string) => void;
  onExitToLobby: () => void;
}

function formatHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function hasAnswerContent(qType: Question['questionType'], res: QuestionResponse | undefined): boolean {
  if (!res) return false;
  if (qType === 'mcq') return Boolean(res.selectedOptionId);
  return Boolean(
    (res.textAnswer && res.textAnswer.trim().length > 0) ||
      (res.codeAnswer && res.codeAnswer.trim().length > 0) ||
      (res.diagramJson && res.diagramJson.trim().length > 2),
  );
}

export function CBTExamRunner({
  attempt,
  questions,
  initialResponses,
  descriptiveCharLimit,
  onSubmitted,
  onExitToLobby,
}: CBTExamRunnerProps) {
  // Security Invariant: Strip answers, explanations, rubrics, and hidden tests immediately
  const safeQuestions = useMemo(
    () => questions.map((q) => projectQuestionForActiveExam(q)),
    [questions],
  );

  const [currentIdx, setCurrentIdx] = useState(
    Math.min(attempt.currentQuestionIndex, Math.max(0, safeQuestions.length - 1)),
  );
  const [responsesByQid, setResponsesByQid] = useState<Record<string, QuestionResponse>>(() => {
    const map: Record<string, QuestionResponse> = {};
    for (const r of initialResponses) {
      map[r.questionId] = r;
    }
    return map;
  });
  const [navFilter, setNavFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [navOpen, setNavOpen] = useState(true);
  const [savedAtText, setSavedAtText] = useState('Synced');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [useKoreanLimit, setUseKoreanLimit] = useState(false);
  const [splitPercent, setSplitPercent] = useState(48);

  const isDraggingSplit = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  // Wall-clock remaining seconds (survives reload!)
  const computeRemaining = useCallback(() => {
    if (!attempt.deadlineAt) return attempt.durationSeconds;
    const diffMs = new Date(attempt.deadlineAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  }, [attempt.deadlineAt, attempt.durationSeconds]);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => computeRemaining());

  const activeQuestion = safeQuestions[currentIdx];
  const activeResponse = activeQuestion ? responsesByQid[activeQuestion.id] : undefined;
  const activeCharLimit = useKoreanLimit
    ? BLUEPRINT_2026.descriptiveKoreanCharLimit
    : descriptiveCharLimit;

  const persistResponse = useCallback(
    (questionId: string, patch: Partial<QuestionResponse>) => {
      const now = Date.now();
      const deltaSec = Math.max(0, Math.min(300, Math.round((now - lastTickRef.current) / 1000)));
      lastTickRef.current = now;

      setResponsesByQid((prev) => {
        const existing = prev[questionId];
        const updated: QuestionResponse = {
          id: existing?.id ?? `${attempt.id}-${questionId}`,
          attemptId: attempt.id,
          questionId,
          selectedOptionId: existing?.selectedOptionId,
          textAnswer: existing?.textAnswer,
          codeAnswer: existing?.codeAnswer,
          codeLanguage: existing?.codeLanguage,
          diagramJson: existing?.diagramJson,
          isFlagged: existing?.isFlagged ?? false,
          timeSpentSeconds: (existing?.timeSpentSeconds ?? 0) + deltaSec,
          evaluationStatus: 'unanswered',
          earnedPoints: 0,
          ...patch,
          updatedAt: new Date().toISOString(),
        };

        void db.responses.put(updated).then(() => {
          setSavedAtText(`Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
        });

        return { ...prev, [questionId]: updated };
      });
    },
    [attempt.id],
  );

  const navigateTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(safeQuestions.length - 1, nextIndex));
      setCurrentIdx(clamped);
      lastTickRef.current = Date.now();
      void db.examAttempts.update(attempt.id, { currentQuestionIndex: clamped });
    },
    [attempt.id, safeQuestions.length],
  );

  const finalizeSubmission = useCallback(
    async (reason: 'manual' | 'timeout') => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      try {
        const currentResponses = Object.values(responsesByQid);
        const responseByQid = new Map(currentResponses.map((r) => [r.questionId, r]));

        // Grade MCQs objectively; leave submitted non-MCQs strictly as pending_evaluation (0 pts until graded)
        const finalizedResponses: QuestionResponse[] = [];
        for (const fullQ of questions) {
          const existing = responseByQid.get(fullQ.id);
          if (fullQ.questionType === 'mcq') {
            const selected = existing?.selectedOptionId;
            const correct = Boolean(selected && selected === fullQ.correctOptionId);
            const finalRes: QuestionResponse = {
              id: existing?.id ?? `${attempt.id}-${fullQ.id}`,
              attemptId: attempt.id,
              questionId: fullQ.id,
              selectedOptionId: selected,
              isFlagged: existing?.isFlagged ?? false,
              timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
              evaluationStatus: selected ? 'auto_graded' : 'unanswered',
              earnedPoints: correct ? fullQ.pointValue : 0,
              updatedAt: new Date().toISOString(),
            };
            finalizedResponses.push(finalRes);

            // Update topic mastery for auto-graded MCQs
            const m = await db.topicMastery.get(fullQ.topicId);
            if (m) {
              await db.topicMastery.put(
                updateTopicMastery({
                  current: m,
                  earnedPoints: finalRes.earnedPoints,
                  maxPoints: fullQ.pointValue,
                  difficulty: fullQ.difficulty,
                  questionType: fullQ.questionType,
                  responseTimeSeconds: finalRes.timeSpentSeconds,
                  estimatedSeconds: fullQ.estimatedSeconds,
                }),
              );
            }
          } else {
            const hasContent = hasAnswerContent(fullQ.questionType, existing);
            const finalRes: QuestionResponse = {
              id: existing?.id ?? `${attempt.id}-${fullQ.id}`,
              attemptId: attempt.id,
              questionId: fullQ.id,
              textAnswer: existing?.textAnswer,
              codeAnswer: existing?.codeAnswer,
              codeLanguage: existing?.codeLanguage,
              diagramJson: existing?.diagramJson,
              isFlagged: existing?.isFlagged ?? false,
              timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
              evaluationStatus: hasContent ? 'pending_evaluation' : 'unanswered',
              earnedPoints: 0, // Critical invariant: never silently award points
              updatedAt: new Date().toISOString(),
            };
            finalizedResponses.push(finalRes);
          }
        }

        await db.responses.bulkPut(finalizedResponses);
        const report = scoreExamAttempt(questions, finalizedResponses);

        await db.examAttempts.put({
          ...attempt,
          status: 'submitted',
          completedAt: new Date().toISOString(),
          evaluatedPoints: report.evaluatedPoints,
          pendingPoints: report.pendingPoints,
          rawCorrectCount: report.rawCorrectCount,
          rawEvaluatedCount: report.rawEvaluatedCount,
          currentQuestionIndex: currentIdx,
        });

        const elapsedMins = Math.max(
          1,
          Math.round((attempt.durationSeconds - remainingSeconds) / 60),
        );
        await logStudySession(
          elapsedMins,
          questions.length,
          reason === 'timeout' ? '2026 Full Mock (Auto-Submitted)' : '2026 Full Mock Exam',
        );

        onSubmitted(attempt.id);
      } finally {
        setSubmitting(false);
      }
    },
    [attempt, currentIdx, onSubmitted, questions, remainingSeconds, responsesByQid],
  );

  // Countdown tick + auto-submit on expiration
  useEffect(() => {
    const remaining = computeRemaining();
    setRemainingSeconds(remaining);
    if (remaining <= 0) {
      void finalizeSubmission('timeout');
      return;
    }

    const interval = window.setInterval(() => {
      const next = computeRemaining();
      setRemainingSeconds(next);
      if (next <= 0) {
        window.clearInterval(interval);
        void finalizeSubmission('timeout');
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [computeRemaining, finalizeSubmission]);

  // Keyboard shortcuts (Alt+N / Alt+Right, Alt+P / Alt+Left, Alt+F, 1-4 for MCQ)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT' ||
        target?.isContentEditable;

      if (e.altKey && (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        navigateTo(currentIdx + 1);
      } else if (e.altKey && (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        navigateTo(currentIdx - 1);
      } else if (e.altKey && e.key.toLowerCase() === 'f' && activeQuestion) {
        e.preventDefault();
        persistResponse(activeQuestion.id, { isFlagged: !activeResponse?.isFlagged });
      } else if (!isTyping && activeQuestion?.questionType === 'mcq') {
        const keyMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
          '1': 'A',
          '2': 'B',
          '3': 'C',
          '4': 'D',
        };
        const chosen = keyMap[e.key];
        if (chosen) {
          e.preventDefault();
          persistResponse(activeQuestion.id, { selectedOptionId: chosen });
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestion, activeResponse?.isFlagged, currentIdx, navigateTo, persistResponse]);

  // Resizable split pane drag handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDraggingSplit.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(30, Math.min(70, pct)));
    }
    function onMouseUp() {
      isDraggingSplit.current = false;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const stats = useMemo(() => {
    let answered = 0;
    let flagged = 0;
    safeQuestions.forEach((q) => {
      const r = responsesByQid[q.id];
      if (hasAnswerContent(q.questionType, r)) answered += 1;
      if (r?.isFlagged) flagged += 1;
    });
    return {
      answered,
      flagged,
      unanswered: safeQuestions.length - answered,
    };
  }, [safeQuestions, responsesByQid]);

  // Group indices by M1-M4 for clean navigator
  const groupedIndices = useMemo(() => {
    const groups: Record<DomainId, number[]> = { M1: [], M2: [], M3: [], M4: [] };
    safeQuestions.forEach((q, idx) => {
      const r = responsesByQid[q.id];
      const isAns = hasAnswerContent(q.questionType, r);
      const isFlg = Boolean(r?.isFlagged);
      if (navFilter === 'unanswered' && isAns) return;
      if (navFilter === 'flagged' && !isFlg) return;
      if (typeFilter !== 'all' && q.questionType !== typeFilter) return;
      groups[q.domain].push(idx);
    });
    return groups;
  }, [safeQuestions, responsesByQid, navFilter, typeFilter]);

  if (!activeQuestion) return null;

  const isLowTime = remainingSeconds < 300;
  const isWarningTime = remainingSeconds < 900 && !isLowTime;

  const starterCode =
    typeof activeQuestion.scenarioData?.starterCode === 'string'
      ? activeQuestion.scenarioData.starterCode
      : '';

  const textValue = activeResponse?.textAnswer ?? '';
  const codeValue = activeResponse?.codeAnswer ?? starterCode;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900">
      {/* Official-Style CBT Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            aria-label={navOpen ? 'Collapse question navigator' : 'Expand question navigator'}
            title={navOpen ? 'Hide Navigator (more room for Diagram/Code IDE)' : 'Show Navigator'}
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-brand-600 font-mono text-xs font-bold text-white">
            PC
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900">
              {attempt.title}
            </h1>
            <p className="text-[11px] text-slate-500">
              Unofficial 2026 TOPCIT CBT Simulator · Explanations Hidden Until Submission
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <span className="font-mono font-semibold text-emerald-700">
              {stats.answered}/{safeQuestions.length} Answered
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono font-semibold text-amber-700">
              {stats.flagged} Flagged
            </span>
          </div>

          <div
            role="timer"
            aria-label="Remaining examination time"
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 font-mono text-sm font-bold tabular-nums ${
              isLowTime
                ? 'border-red-400 bg-red-50 text-red-700'
                : isWarningTime
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-300 bg-slate-50 text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatHms(remainingSeconds)}
          </div>

          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Save className="h-3.5 w-3.5 text-emerald-600" />
            {savedAtText}
          </span>

          <Button variant="outline" size="sm" onClick={onExitToLobby}>
            Save &amp; Pause View
          </Button>
          <Button size="sm" onClick={() => setConfirmOpen(true)}>
            <Send className="h-3.5 w-3.5" />
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main CBT Body: Left Navigator + Resizable Split Pane */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Question Navigator (Collapsible for Wide Diagram/Code IBT Space) */}
        {navOpen ? (
        <aside
          aria-label="Question Navigator"
          className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white"
        >
          <div className="border-b border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>Navigator (75 Items)</span>
              <span className="font-mono text-[11px] text-slate-500">
                #{currentIdx + 1}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['all', 'unanswered', 'flagged'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setNavFilter(tab)}
                  className={`rounded px-1.5 py-1 text-[10px] font-medium capitalize cursor-pointer ${
                    navFilter === tab
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by question type">
              {(
                [
                  ['all', 'All'],
                  ['mcq', 'MCQ (60)'],
                  ['descriptive', 'Desc (7)'],
                  ['standard_performance', 'Perf (5)'],
                  ['integrated_performance', 'Int (3)'],
                ] as const
              ).map(([tKey, label]) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tKey);
                    if (tKey !== 'all') {
                      const firstMatch = safeQuestions.findIndex((q) => q.questionType === tKey);
                      if (firstMatch >= 0) navigateTo(firstMatch);
                    }
                  }}
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-medium cursor-pointer ${
                    typeFilter === tKey
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {BLUEPRINT_2026.domainOrder.map((domainId) => {
              const indices = groupedIndices[domainId];
              if (indices.length === 0) return null;
              return (
                <div key={domainId}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>
                      {domainId} · {BLUEPRINT_2026.domains[domainId].shortName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {BLUEPRINT_2026.domains[domainId].totalPoints}p
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {indices.map((idx) => {
                      const q = safeQuestions[idx];
                      const r = responsesByQid[q.id];
                      const isCurrent = idx === currentIdx;
                      const isAns = hasAnswerContent(q.questionType, r);
                      const isFlg = Boolean(r?.isFlagged);
                      const typeTag =
                        q.questionType === 'descriptive'
                          ? 'D'
                          : q.questionType === 'standard_performance'
                            ? 'P'
                            : q.questionType === 'integrated_performance'
                              ? 'I'
                              : '';
                      const typeBorderBg =
                        q.questionType === 'descriptive'
                          ? 'border-sky-300 bg-sky-50/70 text-sky-900 hover:bg-sky-100'
                          : q.questionType === 'standard_performance'
                            ? 'border-violet-300 bg-violet-50/80 text-violet-900 hover:bg-violet-100'
                            : q.questionType === 'integrated_performance'
                              ? 'border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100';

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => navigateTo(idx)}
                          title={`Q${idx + 1} · ${QUESTION_TYPE_LABELS[q.questionType]} (${q.pointValue}p)${q.practicalSubtype ? ` · ${q.practicalSubtype.toUpperCase()}` : ''}`}
                          aria-label={`Question ${idx + 1}, ${QUESTION_TYPE_LABELS[q.questionType]}${isAns ? ', answered' : ', unanswered'}${isFlg ? ', flagged' : ''}`}
                          aria-current={isCurrent ? 'step' : undefined}
                          className={`relative flex h-9 flex-col items-center justify-center rounded border font-mono text-[11px] font-semibold leading-none transition-colors cursor-pointer ${
                            isCurrent
                              ? 'border-brand-600 bg-brand-600 text-white ring-2 ring-brand-200'
                              : isAns
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : typeBorderBg
                          }`}
                        >
                          <span>{idx + 1}</span>
                          {typeTag ? (
                            <span
                              className={`mt-0.5 text-[8px] font-bold tracking-tight ${
                                isCurrent ? 'text-white/90' : 'opacity-80'
                              }`}
                            >
                              {typeTag}
                            </span>
                          ) : null}
                          {isFlg ? (
                            <span
                              aria-hidden="true"
                              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 p-3 text-[10px] text-slate-500 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-sky-100 border border-sky-400" />
                D=Desc 30p
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-violet-100 border border-violet-400" />
                P=Perf 50p
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-brand-100 border border-brand-400" />
                I=Int 80p
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-100 border border-emerald-400" />
                Answered
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Flagged
              </span>
            </div>
            <p>Shortcuts: Alt+N Next · Alt+P Prev · Alt+F Flag · 1-4 MCQ</p>
          </div>
        </aside>
        ) : null}

        {/* Center/Right Resizable Split Panels */}
        <div
          ref={splitContainerRef}
          className="flex min-w-0 flex-1 flex-col lg:flex-row overflow-hidden"
        >
          {/* Question Stem Pane */}
          <section
            aria-label="Question Stem"
            style={{ width: `${splitPercent}%` }}
            className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-y-auto border-b border-slate-200 bg-white p-5 lg:border-b-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-700">
                  Q{currentIdx + 1}
                </span>
                <Badge variant="brand">
                  {activeQuestion.domain} · {BLUEPRINT_2026.domains[activeQuestion.domain].shortName}
                </Badge>
                <Badge variant="neutral">
                  {QUESTION_TYPE_LABELS[activeQuestion.questionType]}
                </Badge>
                <Badge variant="info">{activeQuestion.pointValue} pts</Badge>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {activeQuestion.id}
              </span>
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              {activeQuestion.title}
            </h2>

            <div className="mt-3">
              <QuestionStemRenderer
                questionId={activeQuestion.id}
                prompt={activeQuestion.prompt}
              />
            </div>

            {/* Visible Sample Test Cases Only (Hidden tests stripped by projectQuestionForActiveExam) */}
            {activeQuestion.sampleTestCases && activeQuestion.sampleTestCases.length > 0 ? (
              <div className="mt-5 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Visible Sample Test Cases
                </h3>
                {activeQuestion.sampleTestCases.map((tc, idx) => (
                  <div
                    key={tc.id}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs"
                  >
                    <p className="font-sans text-[11px] font-semibold text-slate-700">
                      Sample #{idx + 1} {tc.description ? `— ${tc.description}` : ''}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Input:</span>
                        <pre className="mt-0.5 rounded bg-white p-2 border border-slate-200 whitespace-pre-wrap">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Expected Output:</span>
                        <pre className="mt-0.5 rounded bg-white p-2 border border-slate-200 whitespace-pre-wrap">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {typeof activeQuestion.scenarioData?.schemaSql === 'string' ? (
              <div className="mt-5">
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Database Schema Reference
                </h3>
                <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  {activeQuestion.scenarioData.schemaSql.trim()}
                </pre>
              </div>
            ) : null}
          </section>

          {/* Resizable Divider Handle */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize question and answer panels"
            onMouseDown={() => {
              isDraggingSplit.current = true;
            }}
            className="hidden lg:flex w-2.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-100 hover:bg-brand-100 border-x border-slate-200"
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
          </div>

          {/* Answer Workspace Pane */}
          <section
            aria-label="Answer Workspace"
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50/70 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Answer Workspace
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                <span>Exam Security Active · Auto-saving</span>
              </div>
            </div>

            {activeQuestion.questionType === 'mcq' && activeQuestion.options ? (
              <div className="space-y-3" role="radiogroup" aria-label="Multiple choice options">
                {activeQuestion.options.map((opt) => {
                  const selected = activeResponse?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        persistResponse(activeQuestion.id, { selectedOptionId: opt.id })
                      }
                      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-brand-600 bg-brand-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
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
                      <span className="text-sm leading-relaxed text-slate-900">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : activeQuestion.practicalSubtype === 'coding' ||
              activeQuestion.practicalSubtype === 'sql' ? (
              <EmbeddedExamCodeWorkspace
                key={activeQuestion.id}
                mode={activeQuestion.practicalSubtype}
                value={codeValue}
                defaultStdin={activeQuestion.sampleTestCases?.[0]?.input ?? ''}
                schemaSql={
                  typeof activeQuestion.scenarioData?.schemaSql === 'string'
                    ? activeQuestion.scenarioData.schemaSql
                    : ''
                }
                onChange={(nextCode) =>
                  persistResponse(activeQuestion.id, {
                    codeAnswer: nextCode,
                    codeLanguage: activeQuestion.practicalSubtype === 'sql' ? 'sql' : 'python',
                  })
                }
              />
            ) : activeQuestion.practicalSubtype === 'diagram' ? (
              <div className="flex flex-1 flex-col space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Interactive IBT Diagram Editor — click or drag shapes, connect handles, autosaved to attempt.
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setNavOpen((o) => !o)}>
                    {navOpen ? 'Maximize Canvas' : 'Show Navigator'}
                  </Button>
                </div>
                <DiagramWorkspace
                  key={activeQuestion.id}
                  diagramType={
                    (activeQuestion.scenarioData?.diagramType as DiagramType) ?? 'uml_activity'
                  }
                  mode="blank"
                  embedded
                  onChangeGraphJson={(json) =>
                    persistResponse(activeQuestion.id, { diagramJson: json })
                  }
                />
              </div>
            ) : activeQuestion.practicalSubtype === 'multi_artifact' ? (
              <div className="flex flex-1 flex-col space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Multi-Artifact Integrated IBT Simulator (80 pts)
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setNavOpen((o) => !o)}>
                    {navOpen ? 'Expand Workspace' : 'Show Navigator'}
                  </Button>
                </div>

                <Tabs defaultValue="written" className="flex flex-1 flex-col">
                  <TabsList className="w-fit">
                    <TabsTrigger value="written">1. Written Design</TabsTrigger>
                    <TabsTrigger value="diagram">2. Interactive Diagram</TabsTrigger>
                    <TabsTrigger value="code">
                      3. {activeQuestion.scenarioData?.language === 'sql' ? 'Live SQL Editor' : 'Live Code Editor'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="written" className="flex-1">
                    <textarea
                      aria-label="Examination written response"
                      value={textValue}
                      onChange={(e) =>
                        persistResponse(activeQuestion.id, { textAnswer: e.target.value })
                      }
                      rows={15}
                      placeholder="Write your numbered deliverables (Architecture, Algorithms/SQL, Security Controls, Test Plan)..."
                      className="h-full w-full rounded-md border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600"
                    />
                  </TabsContent>

                  <TabsContent value="diagram" className="flex-1">
                    <DiagramWorkspace
                      key={`int-diag-${activeQuestion.id}`}
                      diagramType={
                        (activeQuestion.scenarioData?.diagramType as DiagramType) ?? 'uml_component'
                      }
                      mode="blank"
                      embedded
                      onChangeGraphJson={(json) =>
                        persistResponse(activeQuestion.id, { diagramJson: json })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="code" className="flex-1">
                    <EmbeddedExamCodeWorkspace
                      key={`int-code-${activeQuestion.id}`}
                      mode={activeQuestion.scenarioData?.language === 'sql' ? 'sql' : 'coding'}
                      value={codeValue}
                      schemaSql={
                        typeof activeQuestion.scenarioData?.schemaSql === 'string'
                          ? activeQuestion.scenarioData.schemaSql
                          : ''
                      }
                      onChange={(nextCode) =>
                        persistResponse(activeQuestion.id, {
                          codeAnswer: nextCode,
                          codeLanguage:
                            activeQuestion.scenarioData?.language === 'sql' ? 'sql' : 'python',
                        })
                      }
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-1 flex-col space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    {activeQuestion.questionType === 'descriptive'
                      ? 'Descriptive Answer Editor'
                      : 'Performance / Integrated Scenario Response'}
                  </span>
                  {activeQuestion.questionType === 'descriptive' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUseKoreanLimit((v) => !v)}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Limit: {useKoreanLimit ? '450 Korean Ref' : `${activeCharLimit} chars`}
                      </button>
                      <span
                        className={`font-mono tabular-nums ${
                          textValue.length > activeCharLimit
                            ? 'font-semibold text-red-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {textValue.length} / {activeCharLimit}
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-slate-500">
                      {textValue.length} chars · Worth {activeQuestion.pointValue} pts
                    </span>
                  )}
                </div>

                <textarea
                  aria-label="Examination written response"
                  value={textValue}
                  onChange={(e) =>
                    persistResponse(activeQuestion.id, { textAnswer: e.target.value })
                  }
                  rows={16}
                  placeholder="Address every numbered requirement clearly. Unfinished blank submissions receive 0 points; submitted descriptive/practical tasks will be graded against the official rubric after submission."
                  className="flex-1 w-full rounded-md border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600"
                />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeResponse?.isFlagged ? 'danger' : 'outline'}
            size="sm"
            onClick={() =>
              persistResponse(activeQuestion.id, { isFlagged: !activeResponse?.isFlagged })
            }
          >
            <Flag className="h-3.5 w-3.5" />
            {activeResponse?.isFlagged ? 'Flagged for Review' : 'Flag for Review'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => navigateTo(currentIdx - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentIdx < safeQuestions.length - 1 ? (
            <Button size="sm" onClick={() => navigateTo(currentIdx + 1)}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Review &amp; Submit
            </Button>
          )}
        </div>
      </footer>

      {/* Submit Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit 2026 Full Mock Examination?</DialogTitle>
            <DialogDescription>
              Once submitted, answers are locked, all 60 MCQs are auto-graded immediately, and submitted descriptive/practical responses enter transparent rubric evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded border border-emerald-200 bg-emerald-50 p-2.5">
                <p className="text-emerald-700">Answered</p>
                <p className="font-mono text-base font-bold text-emerald-900">{stats.answered}</p>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-slate-600">Unanswered</p>
                <p className="font-mono text-base font-bold text-slate-900">{stats.unanswered}</p>
              </div>
              <div className="rounded border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-amber-700">Flagged</p>
                <p className="font-mono text-base font-bold text-amber-900">{stats.flagged}</p>
              </div>
            </div>

            {stats.unanswered > 0 ? (
              <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  You have <strong>{stats.unanswered}</strong> unanswered item(s). Unfinished items strictly receive 0 points.
                </span>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Return to Exam
              </Button>
              <Button onClick={() => void finalizeSubmission('manual')} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm & Submit Exam'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
