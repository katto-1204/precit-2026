export type DomainId = 'M1' | 'M2' | 'M3' | 'M4';

export type QuestionType =
  | 'mcq'
  | 'descriptive'
  | 'standard_performance'
  | 'integrated_performance';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DomainAllocation {
  readonly id: DomainId;
  readonly code: DomainId;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly counts: Record<QuestionType, number>;
  readonly totalQuestions: number;
  readonly totalPoints: number;
  readonly weightPercent: number;
}

export interface Blueprint2026Spec {
  readonly version: string;
  readonly effectiveDate: string;
  readonly totalQuestions: 75;
  readonly totalPoints: 1000;
  readonly durationMinutes: 150;
  readonly durationSeconds: 9000;
  readonly domainCount: 4;
  readonly pointsByType: Readonly<Record<QuestionType, number>>;
  readonly totalCountsByType: Readonly<Record<QuestionType, number>>;
  readonly totalPointsByType: Readonly<Record<QuestionType, number>>;
  readonly domains: Readonly<Record<DomainId, DomainAllocation>>;
  readonly domainOrder: readonly DomainId[];
  readonly descriptiveKoreanCharLimit: 450;
  readonly descriptiveEnglishDefaultCharLimit: 1500;
}

export const QUESTION_TYPE_LABELS: Readonly<Record<QuestionType, string>> = {
  mcq: 'Multiple Choice',
  descriptive: 'Descriptive',
  standard_performance: 'Standard Performance',
  integrated_performance: 'Integrated Performance',
};

export const BLUEPRINT_2026: Blueprint2026Spec = {
  version: 'TOPCIT-2026-V4.0E',
  effectiveDate: '2026-05-16',
  totalQuestions: 75,
  totalPoints: 1000,
  durationMinutes: 150,
  durationSeconds: 9000,
  domainCount: 4,
  pointsByType: {
    mcq: 5,
    descriptive: 30,
    standard_performance: 50,
    integrated_performance: 80,
  },
  totalCountsByType: {
    mcq: 60,
    descriptive: 7,
    standard_performance: 5,
    integrated_performance: 3,
  },
  totalPointsByType: {
    mcq: 300,
    descriptive: 210,
    standard_performance: 250,
    integrated_performance: 240,
  },
  domainOrder: ['M1', 'M2', 'M3', 'M4'],
  domains: {
    M1: {
      id: 'M1',
      code: 'M1',
      name: 'Software Development',
      shortName: 'Software Dev',
      description:
        'Software engineering lifecycle, algorithms & data structures, AI & programming languages, UML analysis/design, testing and maintenance.',
      counts: {
        mcq: 15,
        descriptive: 2,
        standard_performance: 3,
        integrated_performance: 1,
      },
      totalQuestions: 21,
      totalPoints: 365,
      weightPercent: 36.5,
    },
    M2: {
      id: 'M2',
      code: 'M2',
      name: 'Data Management',
      shortName: 'Data Mgmt',
      description:
        'Database fundamentals, ER modeling & normalization, SQL queries & transactions, DB operations & tuning, data analysis & data-driven AI.',
      counts: {
        mcq: 15,
        descriptive: 2,
        standard_performance: 1,
        integrated_performance: 1,
      },
      totalQuestions: 19,
      totalPoints: 265,
      weightPercent: 26.5,
    },
    M3: {
      id: 'M3',
      code: 'M3',
      name: 'Systems Architecture and Information Security',
      shortName: 'Arch & Security',
      description:
        'Computer architecture, OS, networks & communications, distributed/cloud systems architecture, information security fundamentals, cryptography & secure coding.',
      counts: {
        mcq: 15,
        descriptive: 1,
        standard_performance: 1,
        integrated_performance: 1,
      },
      totalQuestions: 18,
      totalPoints: 235,
      weightPercent: 23.5,
    },
    M4: {
      id: 'M4',
      code: 'M4',
      name: 'IT Business',
      shortName: 'IT Business',
      description:
        'IT business strategy & solutions, IT project management (WBS, estimation, risk), technical communication & documentation, IT law & ethics.',
      counts: {
        mcq: 15,
        descriptive: 2,
        standard_performance: 0,
        integrated_performance: 0,
      },
      totalQuestions: 17,
      totalPoints: 135,
      weightPercent: 13.5,
    },
  },
  descriptiveKoreanCharLimit: 450,
  descriptiveEnglishDefaultCharLimit: 1500,
};

export interface CompetencyLevelInfo {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  minScore: number;
  maxScore: number;
  description: string;
}

export const COMPETENCY_LEVELS: readonly CompetencyLevelInfo[] = [
  {
    level: 1,
    label: 'Level 1 — Novice',
    minScore: 0,
    maxScore: 149,
    description: 'Foundational gaps in core technical and business IT concepts.',
  },
  {
    level: 2,
    label: 'Level 2 — Advanced Beginner',
    minScore: 150,
    maxScore: 399,
    description: 'Understands basic IT concepts and problems, building practical solving fluency.',
  },
  {
    level: 3,
    label: 'Level 3 — Competent',
    minScore: 400,
    maxScore: 649,
    description: 'Demonstrates solid intermediate practical IT competency expected of BSIT graduates.',
  },
  {
    level: 4,
    label: 'Level 4 — Proficient',
    minScore: 650,
    maxScore: 849,
    description: 'Independently solves complex practical engineering and business IT problems.',
  },
  {
    level: 5,
    label: 'Level 5 — Expert',
    minScore: 850,
    maxScore: 1000,
    description: 'Advanced systems thinking and comprehensive mastery across IT domains.',
  },
];

export function getCompetencyLevel(score: number): CompetencyLevelInfo {
  const clamped = Math.max(0, Math.min(1000, Math.round(score)));
  const found = COMPETENCY_LEVELS.find(
    (entry) => clamped >= entry.minScore && clamped <= entry.maxScore,
  );
  return found ?? COMPETENCY_LEVELS[0];
}

export interface BlueprintQuestionLike {
  id: string;
  domain: DomainId;
  questionType: QuestionType;
  pointValue: number;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  rubric?: { maxPoints: number }[];
}

export interface BlueprintValidationResult {
  valid: boolean;
  errors: string[];
  totalQuestions: number;
  totalPoints: number;
  byDomain: Record<DomainId, { count: number; points: number; byType: Record<QuestionType, number> }>;
}

export function validateExamBlueprint(
  questions: readonly BlueprintQuestionLike[],
): BlueprintValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  const byDomain: BlueprintValidationResult['byDomain'] = {
    M1: { count: 0, points: 0, byType: { mcq: 0, descriptive: 0, standard_performance: 0, integrated_performance: 0 } },
    M2: { count: 0, points: 0, byType: { mcq: 0, descriptive: 0, standard_performance: 0, integrated_performance: 0 } },
    M3: { count: 0, points: 0, byType: { mcq: 0, descriptive: 0, standard_performance: 0, integrated_performance: 0 } },
    M4: { count: 0, points: 0, byType: { mcq: 0, descriptive: 0, standard_performance: 0, integrated_performance: 0 } },
  };

  let totalPoints = 0;

  for (const q of questions) {
    if (seenIds.has(q.id)) {
      errors.push(`Duplicate question ID detected in exam: "${q.id}"`);
    }
    seenIds.add(q.id);

    const expectedPoints = BLUEPRINT_2026.pointsByType[q.questionType];
    if (q.pointValue !== expectedPoints) {
      errors.push(
        `Question "${q.id}" (${q.questionType}) has ${q.pointValue} pts; 2026 blueprint requires ${expectedPoints} pts.`,
      );
    }

    if (q.questionType === 'mcq') {
      if (!q.options || q.options.length !== 4) {
        errors.push(`MCQ "${q.id}" must have exactly 4 options.`);
      }
      if (!q.correctOptionId || !q.options?.some((o) => o.id === q.correctOptionId)) {
        errors.push(`MCQ "${q.id}" must specify exactly one valid correctOptionId.`);
      }
    } else if (q.rubric && q.rubric.length > 0) {
      const rubricSum = q.rubric.reduce((acc, item) => acc + item.maxPoints, 0);
      if (rubricSum !== q.pointValue) {
        errors.push(
          `Question "${q.id}" rubric sums to ${rubricSum} pts instead of ${q.pointValue} pts.`,
        );
      }
    }

    const bucket = byDomain[q.domain];
    bucket.count += 1;
    bucket.points += q.pointValue;
    bucket.byType[q.questionType] += 1;
    totalPoints += q.pointValue;
  }

  if (questions.length !== BLUEPRINT_2026.totalQuestions) {
    errors.push(
      `Total questions is ${questions.length}; 2026 blueprint requires exactly ${BLUEPRINT_2026.totalQuestions}.`,
    );
  }

  if (totalPoints !== BLUEPRINT_2026.totalPoints) {
    errors.push(
      `Total points is ${totalPoints}; 2026 blueprint requires exactly ${BLUEPRINT_2026.totalPoints}.`,
    );
  }

  for (const domainId of BLUEPRINT_2026.domainOrder) {
    const spec = BLUEPRINT_2026.domains[domainId];
    const actual = byDomain[domainId];

    if (actual.count !== spec.totalQuestions) {
      errors.push(
        `${domainId} (${spec.name}) has ${actual.count} questions; required ${spec.totalQuestions}.`,
      );
    }
    if (actual.points !== spec.totalPoints) {
      errors.push(
        `${domainId} (${spec.name}) has ${actual.points} points; required ${spec.totalPoints}.`,
      );
    }
    for (const qType of Object.keys(spec.counts) as QuestionType[]) {
      if (actual.byType[qType] !== spec.counts[qType]) {
        errors.push(
          `${domainId} ${qType} count is ${actual.byType[qType]}; required ${spec.counts[qType]}.`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalQuestions: questions.length,
    totalPoints,
    byDomain,
  };
}
