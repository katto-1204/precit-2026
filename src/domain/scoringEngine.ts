import { BLUEPRINT_2026, type DomainId, type QuestionType } from './blueprint2026';
import type { EvaluationStatus, Question, QuestionResponse } from './schemas';

export interface ActiveExamQuestionView {
  id: string;
  title: string;
  prompt: string;
  domain: DomainId;
  topicId: string;
  difficulty: Question['difficulty'];
  questionType: QuestionType;
  practicalSubtype?: Question['practicalSubtype'];
  pointValue: number;
  options?: Question['options'];
  sampleTestCases?: { id: string; input: string; expectedOutput: string; description?: string }[];
  scenarioData?: Record<string, unknown>;
  sourceClassification: Question['sourceClassification'];
  reviewStatus: Question['reviewStatus'];
  estimatedSeconds: number;
}

/**
 * Exam Security Invariant:
 * Never expose correctOptionId, explanation, expectedResponse, grading rubric,
 * or hidden test cases while an exam attempt is in progress.
 */
export function projectQuestionForActiveExam(question: Question): ActiveExamQuestionView {
  return {
    id: question.id,
    title: question.title,
    prompt: question.prompt,
    domain: question.domain,
    topicId: question.topicId,
    difficulty: question.difficulty,
    questionType: question.questionType,
    practicalSubtype: question.practicalSubtype,
    pointValue: question.pointValue,
    options: question.options,
    sampleTestCases: question.sampleTestCases
      ?.filter((tc) => !tc.isHidden)
      .map(({ id, input, expectedOutput, description }) => ({
        id,
        input,
        expectedOutput,
        description,
      })),
    scenarioData: question.scenarioData,
    sourceClassification: question.sourceClassification,
    reviewStatus: question.reviewStatus,
    estimatedSeconds: question.estimatedSeconds,
  };
}

export interface ScoredQuestionResult {
  questionId: string;
  domain: DomainId;
  questionType: QuestionType;
  maxPoints: number;
  earnedPoints: number;
  pendingPoints: number;
  evaluationStatus: EvaluationStatus;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
}

export interface DomainScoreSummary {
  domain: DomainId;
  earnedPoints: number;
  evaluatedMaxPoints: number;
  pendingPoints: number;
  totalMaxPoints: number;
  correctItems: number;
  evaluatedItems: number;
  totalItems: number;
  rawAccuracyPercent: number;
  weightedScorePercent: number;
}

export interface TypeScoreSummary {
  questionType: QuestionType;
  earnedPoints: number;
  evaluatedMaxPoints: number;
  pendingPoints: number;
  totalMaxPoints: number;
  correctItems: number;
  evaluatedItems: number;
  totalItems: number;
}

export interface AttemptScoreReport {
  totalMaxPoints: number;
  evaluatedPoints: number;
  evaluatedMaxPoints: number;
  pendingPoints: number;
  pendingCount: number;
  unansweredCount: number;
  /** Final weighted score out of 1,000 is ONLY reported when ALL items are evaluated. */
  finalWeightedScoreOutOf1000: number | null;
  isFullyEvaluated: boolean;
  hasAiEstimates: boolean;
  rawCorrectCount: number;
  rawEvaluatedCount: number;
  totalQuestions: number;
  rawItemAccuracyPercent: number;
  evaluatedWeightedPercent: number;
  totalTimeSpentSeconds: number;
  byDomain: Record<DomainId, DomainScoreSummary>;
  byType: Record<QuestionType, TypeScoreSummary>;
  itemResults: ScoredQuestionResult[];
}

function hasSubmittedPracticalContent(response: QuestionResponse | undefined): boolean {
  if (!response) return false;
  return Boolean(
    (response.textAnswer && response.textAnswer.trim().length > 0) ||
      (response.codeAnswer && response.codeAnswer.trim().length > 0) ||
      (response.diagramJson && response.diagramJson.trim().length > 2),
  );
}

/**
 * Evaluates a single question response with strict scoring invariants:
 * - MCQ: 5 pts if selectedOptionId === correctOptionId, else 0.
 * - Descriptive / Practical / Integrated:
 *   - Blank / unfinished tasks ALWAYS receive 0 points (status: 'unanswered').
 *   - Submitted tasks without an explicit verified/self/AI grade remain 'pending_evaluation'
 *     with earnedPoints = 0 and pendingPoints = pointValue. Never silently awards points.
 */
export function evaluateSingleResponse(
  question: Question,
  response: QuestionResponse | undefined,
): ScoredQuestionResult {
  const timeSpentSeconds = response?.timeSpentSeconds ?? 0;

  if (question.questionType === 'mcq') {
    if (!response?.selectedOptionId) {
      return {
        questionId: question.id,
        domain: question.domain,
        questionType: question.questionType,
        maxPoints: question.pointValue,
        earnedPoints: 0,
        pendingPoints: 0,
        evaluationStatus: 'unanswered',
        isCorrect: false,
        timeSpentSeconds,
      };
    }

    const correct = response.selectedOptionId === question.correctOptionId;
    return {
      questionId: question.id,
      domain: question.domain,
      questionType: question.questionType,
      maxPoints: question.pointValue,
      earnedPoints: correct ? question.pointValue : 0,
      pendingPoints: 0,
      evaluationStatus: 'auto_graded',
      isCorrect: correct,
      timeSpentSeconds,
    };
  }

  // Non-MCQ: descriptive, standard_performance, integrated_performance
  const submitted = hasSubmittedPracticalContent(response);

  // Critical invariant: unfinished/blank practical or descriptive tasks NEVER receive points
  if (!submitted) {
    return {
      questionId: question.id,
      domain: question.domain,
      questionType: question.questionType,
      maxPoints: question.pointValue,
      earnedPoints: 0,
      pendingPoints: 0,
      evaluationStatus: 'unanswered',
      isCorrect: false,
      timeSpentSeconds,
    };
  }

  const status = response?.evaluationStatus ?? 'pending_evaluation';
  const isGraded =
    status === 'auto_graded' || status === 'self_graded' || status === 'ai_estimated';

  if (!isGraded) {
    return {
      questionId: question.id,
      domain: question.domain,
      questionType: question.questionType,
      maxPoints: question.pointValue,
      earnedPoints: 0,
      pendingPoints: question.pointValue,
      evaluationStatus: 'pending_evaluation',
      isCorrect: null,
      timeSpentSeconds,
    };
  }

  const clampedEarned = Math.max(
    0,
    Math.min(question.pointValue, response?.earnedPoints ?? 0),
  );

  return {
    questionId: question.id,
    domain: question.domain,
    questionType: question.questionType,
    maxPoints: question.pointValue,
    earnedPoints: clampedEarned,
    pendingPoints: 0,
    evaluationStatus: status,
    isCorrect: clampedEarned >= question.pointValue * 0.6,
    timeSpentSeconds,
  };
}

export function scoreExamAttempt(
  questions: readonly Question[],
  responses: readonly QuestionResponse[],
): AttemptScoreReport {
  const responseByQid = new Map(responses.map((r) => [r.questionId, r]));

  const byDomain = {} as Record<DomainId, DomainScoreSummary>;
  for (const domain of BLUEPRINT_2026.domainOrder) {
    byDomain[domain] = {
      domain,
      earnedPoints: 0,
      evaluatedMaxPoints: 0,
      pendingPoints: 0,
      totalMaxPoints: 0,
      correctItems: 0,
      evaluatedItems: 0,
      totalItems: 0,
      rawAccuracyPercent: 0,
      weightedScorePercent: 0,
    };
  }

  const byType = {} as Record<QuestionType, TypeScoreSummary>;
  for (const qt of [
    'mcq',
    'descriptive',
    'standard_performance',
    'integrated_performance',
  ] as QuestionType[]) {
    byType[qt] = {
      questionType: qt,
      earnedPoints: 0,
      evaluatedMaxPoints: 0,
      pendingPoints: 0,
      totalMaxPoints: 0,
      correctItems: 0,
      evaluatedItems: 0,
      totalItems: 0,
    };
  }

  let totalMaxPoints = 0;
  let evaluatedPoints = 0;
  let evaluatedMaxPoints = 0;
  let pendingPoints = 0;
  let pendingCount = 0;
  let unansweredCount = 0;
  let rawCorrectCount = 0;
  let rawEvaluatedCount = 0;
  let totalTimeSpentSeconds = 0;
  let hasAiEstimates = false;

  const itemResults: ScoredQuestionResult[] = [];

  for (const q of questions) {
    const res = evaluateSingleResponse(q, responseByQid.get(q.id));
    itemResults.push(res);

    totalMaxPoints += res.maxPoints;
    totalTimeSpentSeconds += res.timeSpentSeconds;

    const dBucket = byDomain[res.domain];
    const tBucket = byType[res.questionType];
    dBucket.totalItems += 1;
    dBucket.totalMaxPoints += res.maxPoints;
    tBucket.totalItems += 1;
    tBucket.totalMaxPoints += res.maxPoints;

    if (res.evaluationStatus === 'ai_estimated') {
      hasAiEstimates = true;
    }

    if (res.evaluationStatus === 'pending_evaluation') {
      pendingCount += 1;
      pendingPoints += res.pendingPoints;
      dBucket.pendingPoints += res.pendingPoints;
      tBucket.pendingPoints += res.pendingPoints;
    } else {
      if (res.evaluationStatus === 'unanswered') {
        unansweredCount += 1;
      }
      evaluatedPoints += res.earnedPoints;
      evaluatedMaxPoints += res.maxPoints;
      rawEvaluatedCount += 1;

      dBucket.earnedPoints += res.earnedPoints;
      dBucket.evaluatedMaxPoints += res.maxPoints;
      dBucket.evaluatedItems += 1;

      tBucket.earnedPoints += res.earnedPoints;
      tBucket.evaluatedMaxPoints += res.maxPoints;
      tBucket.evaluatedItems += 1;

      if (res.isCorrect) {
        rawCorrectCount += 1;
        dBucket.correctItems += 1;
        tBucket.correctItems += 1;
      }
    }
  }

  for (const domain of BLUEPRINT_2026.domainOrder) {
    const b = byDomain[domain];
    b.rawAccuracyPercent = b.evaluatedItems > 0 ? (b.correctItems / b.evaluatedItems) * 100 : 0;
    b.weightedScorePercent =
      b.evaluatedMaxPoints > 0 ? (b.earnedPoints / b.evaluatedMaxPoints) * 100 : 0;
  }

  const isFullyEvaluated = pendingCount === 0;
  const finalWeightedScoreOutOf1000 =
    isFullyEvaluated && totalMaxPoints === BLUEPRINT_2026.totalPoints
      ? Math.round(evaluatedPoints)
      : null;

  return {
    totalMaxPoints,
    evaluatedPoints,
    evaluatedMaxPoints,
    pendingPoints,
    pendingCount,
    unansweredCount,
    finalWeightedScoreOutOf1000,
    isFullyEvaluated,
    hasAiEstimates,
    rawCorrectCount,
    rawEvaluatedCount,
    totalQuestions: questions.length,
    rawItemAccuracyPercent:
      rawEvaluatedCount > 0 ? (rawCorrectCount / rawEvaluatedCount) * 100 : 0,
    evaluatedWeightedPercent:
      evaluatedMaxPoints > 0 ? (evaluatedPoints / evaluatedMaxPoints) * 100 : 0,
    totalTimeSpentSeconds,
    byDomain,
    byType,
    itemResults,
  };
}
