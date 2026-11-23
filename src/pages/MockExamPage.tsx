import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { CBTExamRunner } from '@/components/exam/CBTExamRunner';
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
  validateExamBlueprint,
} from '@/domain/blueprint2026';
import type { ExamAttempt, Question, QuestionResponse } from '@/domain/schemas';
import { formatDateShort } from '@/lib/utils';

export function MockExamPage() {
  const navigate = useNavigate();
  const allQuestions = useLiveQuery(() => db.questions.toArray(), []) ?? [];
  const attempts = useLiveQuery(() => db.examAttempts.toArray(), []) ?? [];
  const profile = useLiveQuery(() => db.profiles.get('primary'), []);

  const [activeSession, setActiveSession] = useState<{
    attempt: ExamAttempt;
    questions: Question[];
    responses: QuestionResponse[];
  } | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const mockSet1Questions = useMemo(
    () => allQuestions.filter((q) => q.mockSetId === 'mock-2026-set-1'),
    [allQuestions],
  );

  const blueprintCheck = useMemo(
    () => validateExamBlueprint(mockSet1Questions),
    [mockSet1Questions],
  );

  const inProgressMock = useMemo(
    () =>
      attempts
        .filter((a) => a.mode === 'full_mock_2026' && a.status === 'in_progress')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null,
    [attempts],
  );

  const submittedMocks = useMemo(
    () =>
      attempts
        .filter((a) => a.mode === 'full_mock_2026' && a.status === 'submitted')
        .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)),
    [attempts],
  );

  async function handleStartNewMock() {
    setLaunchError(null);
    const check = validateExamBlueprint(mockSet1Questions);
    if (!check.valid) {
      setLaunchError(
        `Blueprint validation failed (${check.errors[0]}). Full mock launch blocked for integrity.`,
      );
      return;
    }

    // Order strictly M1 -> M2 -> M3 -> M4 without duplicates
    const domainRank = { M1: 1, M2: 2, M3: 3, M4: 4 };
    const typeRank = {
      mcq: 1,
      descriptive: 2,
      standard_performance: 3,
      integrated_performance: 4,
    };
    const ordered = [...mockSet1Questions].sort(
      (a, b) =>
        domainRank[a.domain] - domainRank[b.domain] ||
        typeRank[a.questionType] - typeRank[b.questionType] ||
        a.id.localeCompare(b.id),
    );

    const now = Date.now();
    const attempt: ExamAttempt = {
      id: `mock2026-${now}`,
      title: `PrepCIT 2026 Full Mock Exam #${submittedMocks.length + 1}`,
      mode: 'full_mock_2026',
      status: 'in_progress',
      questionIds: ordered.map((q) => q.id),
      startedAt: new Date(now).toISOString(),
      deadlineAt: new Date(now + BLUEPRINT_2026.durationSeconds * 1000).toISOString(),
      durationSeconds: BLUEPRINT_2026.durationSeconds,
      currentQuestionIndex: 0,
      evaluatedPoints: 0,
      pendingPoints: 0,
      maxPoints: BLUEPRINT_2026.totalPoints,
      rawCorrectCount: 0,
      rawEvaluatedCount: 0,
      blueprintVerified: true,
    };

    await db.examAttempts.put(attempt);
    setActiveSession({ attempt, questions: ordered, responses: [] });
  }

  async function handleResumeMock(attempt: ExamAttempt) {
    setLaunchError(null);
    const qById = new Map(allQuestions.map((q) => [q.id, q]));
    const ordered = attempt.questionIds
      .map((id) => qById.get(id))
      .filter((q): q is Question => Boolean(q));
    const savedResponses = await db.responses.where('attemptId').equals(attempt.id).toArray();
    setActiveSession({ attempt, questions: ordered, responses: savedResponses });
  }

  if (activeSession) {
    return (
      <CBTExamRunner
        attempt={activeSession.attempt}
        questions={activeSession.questions}
        initialResponses={activeSession.responses}
        descriptiveCharLimit={
          profile?.descriptiveCharLimit ?? BLUEPRINT_2026.descriptiveEnglishDefaultCharLimit
        }
        onSubmitted={(attemptId) => {
          setActiveSession(null);
          navigate(`/analytics?attempt=${attemptId}`);
        }}
        onExitToLobby={() => setActiveSession(null)}
      />
    );
  }

  const resumeRemainingMins = inProgressMock?.deadlineAt
    ? Math.max(
        0,
        Math.ceil((new Date(inProgressMock.deadlineAt).getTime() - Date.now()) / 60000),
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Full 2026 Mock Examination Simulator
            </h1>
            <Badge variant={blueprintCheck.valid ? 'success' : 'danger'}>
              <ShieldCheck className="h-3 w-3" />
              {blueprintCheck.valid ? '75Q / 1,000 Pts Verified' : 'Blueprint Error'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Realistic timed 150-minute CBT simulation aligned to the May 16, 2026 TOPCIT blueprint. Timer and answers persist across browser reloads.
          </p>
        </div>
      </div>

      {launchError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{launchError}</span>
        </div>
      ) : null}

      {/* Resume Banner if an interrupted exam exists */}
      {inProgressMock ? (
        <Card className="border-brand-300 bg-brand-50/40">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="brand">Interrupted Exam Found</Badge>
                <span className="font-mono text-xs text-slate-600">
                  ~{resumeRemainingMins} min remaining
                </span>
              </div>
              <h2 className="mt-1.5 text-base font-bold text-slate-900">
                {inProgressMock.title}
              </h2>
              <p className="text-xs text-slate-600">
                Started {formatDateShort(inProgressMock.startedAt)} · Resumes at Question #
                {inProgressMock.currentQuestionIndex + 1} with all autosaved responses intact.
              </p>
            </div>
            <Button onClick={() => void handleResumeMock(inProgressMock)}>
              <RotateCcw className="h-4 w-4" />
              Resume Full Mock Exam
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Launch Card & Blueprint Matrix */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-brand-600" />
              <CardTitle>2026 Official-Format CBT Rules</CardTitle>
            </div>
            <CardDescription>
              Strict exam simulation guarantees realistic pacing and zero answer leakage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>
                  <strong>75 Original Verified Questions</strong> across M1–M4 totaling exactly{' '}
                  <strong>1,000 points</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>
                  <strong>150-minute countdown timer</strong> backed by wall-clock persistence and
                  automatic submission at <code className="font-mono">00:00:00</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>
                  <strong>No explanations, rubrics, or AI hints</strong> accessible until final submission.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  Unfinished practical or descriptive items strictly earn <strong>0 points</strong>;
                  submitted written/practical tasks enter transparent rubric grading post-exam.
                </span>
              </li>
            </ul>

            <Button
              size="lg"
              className="w-full"
              disabled={!blueprintCheck.valid}
              onClick={() => void handleStartNewMock()}
            >
              <Play className="h-4 w-4" />
              Start Full 2026 Mock Exam (150 Min)
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Verified 2026 Allocation Matrix (Validated Live)</CardTitle>
            <CardDescription>
              Seeded Mock Set #1 contains {blueprintCheck.totalQuestions} items worth{' '}
              {blueprintCheck.totalPoints.toLocaleString()} points.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Domain</th>
                  <th className="px-3 py-2.5 font-medium">MCQ (5)</th>
                  <th className="px-3 py-2.5 font-medium">Desc (30)</th>
                  <th className="px-3 py-2.5 font-medium">Std (50)</th>
                  <th className="px-3 py-2.5 font-medium">Int (80)</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {BLUEPRINT_2026.domainOrder.map((domainId) => {
                  const d = BLUEPRINT_2026.domains[domainId];
                  return (
                    <tr key={domainId}>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-900">
                        <span className="mr-1.5 font-mono font-bold text-brand-700">{d.code}</span>
                        {d.shortName}
                      </td>
                      <td className="px-3 py-2.5">{d.counts.mcq}</td>
                      <td className="px-3 py-2.5">{d.counts.descriptive}</td>
                      <td className="px-3 py-2.5">{d.counts.standard_performance}</td>
                      <td className="px-3 py-2.5">{d.counts.integrated_performance}</td>
                      <td className="px-4 py-2.5 font-semibold text-brand-700">
                        {d.totalQuestions}Q / {d.totalPoints}p
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-mono text-xs font-bold">
                <tr>
                  <td className="px-4 py-2.5 font-sans">Total</td>
                  <td className="px-3 py-2.5">60</td>
                  <td className="px-3 py-2.5">7</td>
                  <td className="px-3 py-2.5">5</td>
                  <td className="px-3 py-2.5">3</td>
                  <td className="px-4 py-2.5 text-brand-700">75Q / 1,000p</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Completed Mock History */}
      <Card>
        <CardHeader>
          <CardTitle>Completed 2026 Mock Attempts ({submittedMocks.length})</CardTitle>
          <CardDescription>
            Review graded MCQs, complete pending rubric evaluations, and inspect domain analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {submittedMocks.length === 0 ? (
            <p className="p-5 text-xs text-slate-500">
              No completed 2026 full mock examinations yet. Start your first diagnostic mock above to establish a true 2026-format score.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {submittedMocks.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{m.title}</h3>
                    <p className="text-xs text-slate-500">
                      Completed {formatDateShort(m.completedAt ?? m.startedAt)} · Evaluated:{' '}
                      <strong className="font-mono text-slate-800">
                        {m.evaluatedPoints} pts
                      </strong>
                      {m.pendingPoints > 0 ? (
                        <span className="ml-2 font-mono text-amber-700">
                          (+{m.pendingPoints} pts pending rubric grading)
                        </span>
                      ) : (
                        <span className="ml-2 font-mono text-emerald-700">
                          (Final: {m.evaluatedPoints}/1,000)
                        </span>
                      )}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/analytics?attempt=${m.id}`}>
                      Open Results &amp; Grading
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
