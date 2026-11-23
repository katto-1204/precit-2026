import { BLUEPRINT_2026, type Difficulty, type DomainId, type QuestionType } from './blueprint2026';
import type { ErrorCategory, MasteryState, TopicMastery } from './schemas';
import { getTopicById } from './syllabus2026';

export const MASTERY_STATE_META: Readonly<
  Record<MasteryState, { label: string; tone: 'neutral' | 'danger' | 'warning' | 'info' | 'success' }>
> = {
  not_started: { label: 'Not Started', tone: 'neutral' },
  needs_foundation: { label: 'Needs Foundation', tone: 'danger' },
  developing: { label: 'Developing', tone: 'warning' },
  practicing: { label: 'Practicing', tone: 'info' },
  proficient: { label: 'Proficient', tone: 'success' },
  review_needed: { label: 'Review Needed', tone: 'warning' },
};

export interface MasteryUpdateInput {
  current: TopicMastery;
  earnedPoints: number;
  maxPoints: number;
  difficulty: Difficulty;
  questionType: QuestionType;
  responseTimeSeconds: number;
  estimatedSeconds: number;
  nowIso?: string;
}

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 0.75,
  medium: 1.0,
  hard: 1.25,
};

const TYPE_WEIGHT: Record<QuestionType, number> = {
  mcq: 0.85,
  descriptive: 1.15,
  standard_performance: 1.3,
  integrated_performance: 1.45,
};

export function classifyMasteryState(
  competencyScore: number,
  attemptsCount: number,
  daysSinceLastReview: number,
  intervalDays: number,
): MasteryState {
  if (attemptsCount === 0 && competencyScore === 0) return 'not_started';
  if (attemptsCount > 0 && daysSinceLastReview > intervalDays * 1.5 && competencyScore >= 50) {
    return 'review_needed';
  }
  if (competencyScore < 35) return 'needs_foundation';
  if (competencyScore < 55) return 'developing';
  if (competencyScore < 78) return 'practicing';
  return 'proficient';
}

/**
 * Updates topic competency using recent accuracy, weighted score, difficulty,
 * response-time efficiency, repeat errors, practical task weight, and SM-2 spaced repetition.
 */
export function updateTopicMastery(input: MasteryUpdateInput): TopicMastery {
  const {
    current,
    earnedPoints,
    maxPoints,
    difficulty,
    questionType,
    responseTimeSeconds,
    estimatedSeconds,
  } = input;
  const now = input.nowIso ? new Date(input.nowIso) : new Date();
  const scoreRatio = maxPoints > 0 ? Math.max(0, Math.min(1, earnedPoints / maxPoints)) : 0;
  const isPass = scoreRatio >= 0.6;

  // Time efficiency modifier: mild penalty for severe overtime (>1.75x)
  const timeRatio = estimatedSeconds > 0 ? responseTimeSeconds / estimatedSeconds : 1;
  const timeFactor = timeRatio > 1.75 ? 0.9 : timeRatio < 0.35 && !isPass ? 0.85 : 1.0;

  const observedPerformance = scoreRatio * 100 * timeFactor;
  const alpha = Math.min(
    0.45,
    0.18 * DIFFICULTY_WEIGHT[difficulty] * TYPE_WEIGHT[questionType],
  );

  const repeatErrorCount = isPass ? Math.max(0, current.repeatErrorCount - 1) : current.repeatErrorCount + 1;
  const repeatPenalty = !isPass && repeatErrorCount >= 2 ? 4 : 0;

  const updatedScore = Math.max(
    0,
    Math.min(100, Math.round(current.competencyScore * (1 - alpha) + observedPerformance * alpha - repeatPenalty)),
  );

  // Transparent SM-2 inspired scheduling
  const quality = Math.round(scoreRatio * 5); // 0..5
  const nextEase = Math.max(
    1.3,
    Math.min(3.0, Number((current.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2))),
  );

  let nextIntervalDays: number;
  if (!isPass) {
    nextIntervalDays = 1;
  } else if (current.attemptsCount === 0) {
    nextIntervalDays = 1;
  } else if (current.attemptsCount === 1) {
    nextIntervalDays = 3;
  } else {
    nextIntervalDays = Math.min(30, Math.max(1, Math.round(current.intervalDays * nextEase)));
  }

  const nextReviewDate = new Date(now.getTime() + nextIntervalDays * 86_400_000);
  const attemptsCount = current.attemptsCount + 1;
  const correctCount = current.correctCount + (isPass ? 1 : 0);
  const state = classifyMasteryState(updatedScore, attemptsCount, 0, nextIntervalDays);

  const scheduleReason = isPass
    ? `Scored ${Math.round(scoreRatio * 100)}% on ${difficulty} ${questionType.replace('_', ' ')}. Scheduled review in ${nextIntervalDays} day(s) (EF ${nextEase}).`
    : `Missed ${difficulty} ${questionType.replace('_', ' ')} (repeat errors: ${repeatErrorCount}). Reset to 1-day spaced review.`;

  return {
    ...current,
    state,
    competencyScore: updatedScore,
    attemptsCount,
    correctCount,
    repeatErrorCount,
    easeFactor: nextEase,
    intervalDays: nextIntervalDays,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReviewDate.toISOString(),
    scheduleReason,
  };
}

export interface DailyRecommendation {
  id: string;
  topicId: string;
  domain: DomainId;
  topicTitle: string;
  recommendedMode: 'learn' | 'guided_practice' | 'performance_bootcamp' | 'mistake_review';
  targetQuestionType: QuestionType;
  targetDifficulty: Difficulty;
  priorityScore: number;
  estimatedMinutes: number;
  rationale: string;
  route: string;
}

/**
 * Generates balanced daily recommendations driven by weakness + 2026 domain point value.
 * Explicitly prevents recommending only easy MCQs by enforcing descriptive/practical & integrated tasks.
 */
export function generateDailyRecommendations(
  masteries: readonly TopicMastery[],
  limit = 4,
): DailyRecommendation[] {
  const scored = masteries.map((m) => {
    const domainSpec = BLUEPRINT_2026.domains[m.domain];
    const topic = getTopicById(m.topicId);
    const weaknessGap = 100 - m.competencyScore;
    const examValueFactor = domainSpec.weightPercent / 25; // M1=1.46, M2=1.06, M3=0.94, M4=0.54
    const repeatBoost = m.repeatErrorCount * 8;
    const integratedBoost = topic?.supportsIntegratedPractice && m.competencyScore < 35 ? 12 : 0;
    const priorityScore = Math.round(weaknessGap * examValueFactor + repeatBoost + integratedBoost);

    return { mastery: m, topic, domainSpec, priorityScore };
  });

  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const picks: DailyRecommendation[] = [];
  const usedDomains = new Set<DomainId>();

  // First pass: pick highest priority across distinct domains where possible
  for (const item of scored) {
    if (picks.length >= limit) break;
    if (usedDomains.has(item.mastery.domain) && picks.length < 3) continue;
    usedDomains.add(item.mastery.domain);

    const slotIndex = picks.length;
    const isPracticalSlot = slotIndex === 0 || (slotIndex === 2 && item.mastery.domain !== 'M4');
    const isDescriptiveSlot = slotIndex === 1;

    const targetQuestionType: QuestionType = isPracticalSlot
      ? item.topic?.supportsIntegratedPractice && slotIndex === 0
        ? 'integrated_performance'
        : 'standard_performance'
      : isDescriptiveSlot
        ? 'descriptive'
        : 'mcq';

    const targetDifficulty: Difficulty =
      item.mastery.competencyScore < 25 ? 'medium' : 'hard';

    const recommendedMode: DailyRecommendation['recommendedMode'] =
      targetQuestionType === 'integrated_performance' ||
      targetQuestionType === 'standard_performance'
        ? 'performance_bootcamp'
        : item.mastery.state === 'needs_foundation'
          ? 'learn'
          : item.mastery.repeatErrorCount > 0
            ? 'mistake_review'
            : 'guided_practice';

    const route =
      recommendedMode === 'performance_bootcamp'
        ? item.mastery.domain === 'M1' || item.mastery.domain === 'M2'
          ? '/coding-lab'
          : '/diagram-lab'
        : recommendedMode === 'learn'
          ? `/study-library?domain=${item.mastery.domain}&topic=${item.mastery.topicId}`
          : `/practice?domain=${item.mastery.domain}&topic=${item.mastery.topicId}`;

    picks.push({
      id: `rec-${item.mastery.topicId}-${slotIndex}`,
      topicId: item.mastery.topicId,
      domain: item.mastery.domain,
      topicTitle: item.topic?.title ?? item.mastery.topicId,
      recommendedMode,
      targetQuestionType,
      targetDifficulty,
      priorityScore: item.priorityScore,
      estimatedMinutes:
        targetQuestionType === 'integrated_performance'
          ? 35
          : targetQuestionType === 'standard_performance'
            ? 25
            : targetQuestionType === 'descriptive'
              ? 15
              : 15,
      rationale: `${item.mastery.domain} accounts for ${item.domainSpec.totalPoints}/1,000 pts (${item.domainSpec.weightPercent}%). Current competency ${item.mastery.competencyScore}% (${MASTERY_STATE_META[item.mastery.state].label}) — assigned ${targetDifficulty} ${targetQuestionType.replace('_', ' ')} to build real exam points.`,
      route,
    });
  }

  return picks;
}

export const ERROR_CATEGORY_REMEDIATION: Readonly<
  Record<
    ErrorCategory,
    { label: string; description: string; nextExercisePrescription: string }
  >
> = {
  concept_gap: {
    label: 'Concept Gap',
    description: 'Missing foundational definition, protocol, or principle.',
    nextExercisePrescription:
      'Review the Study Library lesson & glossary, then complete 5 medium MCQs + 1 descriptive summary without notes.',
  },
  misread_requirement: {
    label: 'Misread Requirement',
    description: 'Overlooked a constraint, negation, or edge condition in the stem.',
    nextExercisePrescription:
      'Practice untimed Guided Practice with explicit requirement-checklist extraction before answering.',
  },
  wrong_algorithm: {
    label: 'Wrong Algorithm / Approach',
    description: 'Chose an inefficient or logically flawed algorithm or SQL strategy.',
    nextExercisePrescription:
      'Solve 2 medium/hard Coding or SQL Lab tasks comparing brute-force vs optimal time/space complexity.',
  },
  coding_error: {
    label: 'Coding / Syntax / Edge Bug',
    description: 'Correct approach but implementation failed hidden edge-case tests.',
    nextExercisePrescription:
      'Run 2 Debugging Exercises in the Coding Laboratory focusing on boundary inputs and null/empty handling.',
  },
  incorrect_design: {
    label: 'Incorrect UML / Schema / Architecture Design',
    description: 'Missing cardinality, improper normalization, or weak security/component boundaries.',
    nextExercisePrescription:
      'Complete 1 guided ERD/UML/Architecture task in the Diagram Laboratory with structural validation.',
  },
  time_pressure: {
    label: 'Time Pressure',
    description: 'Rushed or ran out of time due to pacing imbalance.',
    nextExercisePrescription:
      'Run a 30-minute Timed Section Test targeting <= 1.2 min per MCQ to bank time for 50-pt and 80-pt tasks.',
  },
  incomplete_response: {
    label: 'Incomplete Response',
    description: 'Omitted rubric sub-requirements in a descriptive or integrated performance prompt.',
    nextExercisePrescription:
      'Practice 2 rubric-checked descriptive/integrated prompts using a bulleted requirement coverage checklist.',
  },
};
