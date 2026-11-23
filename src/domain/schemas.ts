import { z } from 'zod';
import { BLUEPRINT_2026 } from './blueprint2026';

export const DomainIdSchema = z.enum(['M1', 'M2', 'M3', 'M4']);
export const QuestionTypeSchema = z.enum([
  'mcq',
  'descriptive',
  'standard_performance',
  'integrated_performance',
]);
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const SourceClassificationSchema = z.enum([
  'official_sample',
  'licensed_import',
  'original_practice',
  'ai_draft_pending',
]);
export type SourceClassification = z.infer<typeof SourceClassificationSchema>;

export const ReviewStatusSchema = z.enum(['draft', 'in_review', 'verified']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ErrorCategorySchema = z.enum([
  'concept_gap',
  'misread_requirement',
  'wrong_algorithm',
  'coding_error',
  'incorrect_design',
  'time_pressure',
  'incomplete_response',
]);
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

export const MasteryStateSchema = z.enum([
  'not_started',
  'needs_foundation',
  'developing',
  'practicing',
  'proficient',
  'review_needed',
]);
export type MasteryState = z.infer<typeof MasteryStateSchema>;

export const PracticalSubtypeSchema = z.enum([
  'coding',
  'sql',
  'diagram',
  'written_scenario',
  'multi_artifact',
]);
export type PracticalSubtype = z.infer<typeof PracticalSubtypeSchema>;

export const QuestionOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
});

export const RubricCriterionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  maxPoints: z.number().int().positive(),
});

export const SampleTestCaseSchema = z.object({
  id: z.string().min(1),
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
  points: z.number().nonnegative(),
  description: z.string().optional(),
});

export const QuestionReferenceSchema = z.object({
  label: z.string().min(1),
  sourceId: z.string().optional(),
  pageNumber: z.number().int().positive().optional(),
  url: z.string().optional(),
});

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    prompt: z.string().min(10),
    domain: DomainIdSchema,
    topicId: z.string().min(1),
    difficulty: DifficultySchema,
    questionType: QuestionTypeSchema,
    practicalSubtype: PracticalSubtypeSchema.optional(),
    pointValue: z.number().int().positive(),
    options: z.array(QuestionOptionSchema).length(4).optional(),
    correctOptionId: z.enum(['A', 'B', 'C', 'D']).optional(),
    expectedResponse: z.string().optional(),
    rubric: z.array(RubricCriterionSchema).optional(),
    explanation: z.string().min(1),
    references: z.array(QuestionReferenceSchema).default([]),
    sampleTestCases: z.array(SampleTestCaseSchema).optional(),
    scenarioData: z.record(z.unknown()).optional(),
    sourceClassification: SourceClassificationSchema,
    contentVersion: z.string().min(1),
    reviewStatus: ReviewStatusSchema,
    estimatedSeconds: z.number().int().positive(),
    mockSetId: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    const expectedPoints = BLUEPRINT_2026.pointsByType[q.questionType];
    if (q.pointValue !== expectedPoints) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Question type ${q.questionType} must be worth ${expectedPoints} points (got ${q.pointValue}).`,
        path: ['pointValue'],
      });
    }
    if (q.questionType === 'mcq') {
      if (!q.options || q.options.length !== 4 || !q.correctOptionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MCQ questions require 4 options and a correctOptionId.',
          path: ['options'],
        });
      }
    } else if (q.rubric && q.rubric.length > 0) {
      const sum = q.rubric.reduce((acc, c) => acc + c.maxPoints, 0);
      if (sum !== q.pointValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rubric criteria sum (${sum}) must equal pointValue (${q.pointValue}).`,
          path: ['rubric'],
        });
      }
    }
  });

export type Question = z.infer<typeof QuestionSchema>;

export const HistoricalAreaIdSchema = z.enum([
  'software',
  'data',
  'system_architecture',
  'information_security',
  'it_business_ethics',
  'tech_comm_pm',
  'integrated_competencies',
]);

export const HistoricalAreaScoreSchema = z
  .object({
    areaId: HistoricalAreaIdSchema,
    label: z.string().min(1),
    earnedPoints: z.number().nonnegative(),
    maxPoints: z.number().positive(),
    correctItems: z.number().int().nonnegative(),
    totalItems: z.number().int().positive(),
  })
  .refine((a) => a.earnedPoints <= a.maxPoints, {
    message: 'Earned points cannot exceed max points for an area.',
  })
  .refine((a) => a.correctItems <= a.totalItems, {
    message: 'Correct items cannot exceed total items for an area.',
  });

export type HistoricalAreaScore = z.infer<typeof HistoricalAreaScoreSchema>;

export const HistoricalScoreRecordSchema = z
  .object({
    id: z.string().min(1),
    formatYear: z.literal(2025),
    label: z.string().min(1),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format'),
    totalScore: z.number().min(0).max(1000),
    maxScore: z.literal(1000),
    correctItems: z.number().int().min(0),
    totalItems: z.number().int().positive(),
    competencyLevel: z.number().int().min(1).max(5),
    examineeAverage: z.number().min(0).max(1000).optional(),
    top30Reference: z.number().min(0).max(1000).optional(),
    top10Reference: z.number().min(0).max(1000).optional(),
    isVerifiedBaseline: z.boolean().default(false),
    sourceNote: z.string().optional(),
    areas: z.array(HistoricalAreaScoreSchema).min(1),
    importedAt: z.string(),
  })
  .superRefine((record, ctx) => {
    const sumEarned = record.areas.reduce((acc, a) => acc + a.earnedPoints, 0);
    const sumMax = record.areas.reduce((acc, a) => acc + a.maxPoints, 0);
    const sumCorrect = record.areas.reduce((acc, a) => acc + a.correctItems, 0);
    const sumTotalItems = record.areas.reduce((acc, a) => acc + a.totalItems, 0);

    if (Math.abs(sumEarned - record.totalScore) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Area earned points sum (${sumEarned}) does not equal totalScore (${record.totalScore}).`,
        path: ['totalScore'],
      });
    }
    if (Math.abs(sumMax - record.maxScore) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Area max points sum (${sumMax}) does not equal maxScore (${record.maxScore}).`,
        path: ['maxScore'],
      });
    }
    if (sumCorrect !== record.correctItems) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Area correct items sum (${sumCorrect}) does not equal correctItems (${record.correctItems}).`,
        path: ['correctItems'],
      });
    }
    if (sumTotalItems !== record.totalItems) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Area total items sum (${sumTotalItems}) does not equal totalItems (${record.totalItems}).`,
        path: ['totalItems'],
      });
    }
  });

export type HistoricalScoreRecord = z.infer<typeof HistoricalScoreRecordSchema>;

export const EvaluationStatusSchema = z.enum([
  'unanswered',
  'auto_graded',
  'self_graded',
  'ai_estimated',
  'pending_evaluation',
]);
export type EvaluationStatus = z.infer<typeof EvaluationStatusSchema>;

export const QuestionResponseSchema = z.object({
  id: z.string().min(1),
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionId: z.enum(['A', 'B', 'C', 'D']).optional(),
  textAnswer: z.string().optional(),
  codeAnswer: z.string().optional(),
  codeLanguage: z.enum(['python', 'sql', 'c', 'cpp', 'java', 'javascript']).optional(),
  diagramJson: z.string().optional(),
  isFlagged: z.boolean().default(false),
  timeSpentSeconds: z.number().nonnegative().default(0),
  evaluationStatus: EvaluationStatusSchema.default('unanswered'),
  earnedPoints: z.number().nonnegative().default(0),
  rubricScores: z.record(z.number().nonnegative()).optional(),
  errorCategory: ErrorCategorySchema.optional(),
  aiEstimateNote: z.string().optional(),
  updatedAt: z.string(),
});
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const ExamModeSchema = z.enum([
  'full_mock_2026',
  'timed_section',
  'guided_practice',
  'weakness_training',
  'performance_bootcamp',
  'mistake_review',
]);
export type ExamMode = z.infer<typeof ExamModeSchema>;

export const ExamAttemptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  mode: ExamModeSchema,
  domainFilter: DomainIdSchema.optional(),
  status: z.enum(['in_progress', 'submitted', 'abandoned']),
  questionIds: z.array(z.string()).min(1),
  startedAt: z.string(),
  deadlineAt: z.string().optional(),
  completedAt: z.string().optional(),
  durationSeconds: z.number().int().nonnegative(),
  currentQuestionIndex: z.number().int().nonnegative().default(0),
  evaluatedPoints: z.number().nonnegative().default(0),
  pendingPoints: z.number().nonnegative().default(0),
  maxPoints: z.number().positive(),
  rawCorrectCount: z.number().int().nonnegative().default(0),
  rawEvaluatedCount: z.number().int().nonnegative().default(0),
  blueprintVerified: z.boolean().default(false),
});
export type ExamAttempt = z.infer<typeof ExamAttemptSchema>;

export const TopicMasterySchema = z.object({
  topicId: z.string().min(1),
  domain: DomainIdSchema,
  state: MasteryStateSchema,
  competencyScore: z.number().min(0).max(100),
  historicalPriorPercent: z.number().min(0).max(100).optional(),
  attemptsCount: z.number().int().nonnegative().default(0),
  correctCount: z.number().int().nonnegative().default(0),
  repeatErrorCount: z.number().int().nonnegative().default(0),
  easeFactor: z.number().min(1.3).max(3.5).default(2.5),
  intervalDays: z.number().nonnegative().default(1),
  lastReviewedAt: z.string().optional(),
  nextReviewAt: z.string(),
  scheduleReason: z.string(),
});
export type TopicMastery = z.infer<typeof TopicMasterySchema>;

export const UserProfileSchema = z.object({
  id: z.literal('primary'),
  displayName: z.string().min(1),
  targetScore: z.number().int().min(150).max(1000),
  targetExamDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dailyStudyMinutesGoal: z.number().int().min(15).max(480),
  descriptiveCharLimit: z.number().int().min(200).max(4000),
  descriptiveLimitPreset: z.enum(['korean_450', 'english_1500', 'custom']),
  preferredLanguages: z.array(z.enum(['python', 'sql', 'java', 'c', 'cpp'])).min(1),
  streakDays: z.number().int().nonnegative(),
  lastActiveDate: z.string().optional(),
  updatedAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const StudyActivitySchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutesStudied: z.number().nonnegative(),
  questionsPracticed: z.number().int().nonnegative(),
  mode: z.string(),
});
export type StudyActivity = z.infer<typeof StudyActivitySchema>;

export const StudySourceSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  documentType: z.enum(['syllabus', 'study_guide', 'score_report', 'lecture_notes', 'other']),
  yearVersion: z.string().optional(),
  pageCount: z.number().int().positive(),
  extractedConceptCount: z.number().int().nonnegative(),
  mappedDomains: z.array(DomainIdSchema),
  verified: z.boolean().default(false),
  importedAt: z.string(),
});
export type StudySource = z.infer<typeof StudySourceSchema>;

export const LessonSchema = z.object({
  id: z.string().min(1),
  domain: DomainIdSchema,
  topicId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentMarkdown: z.string().min(1),
  workedExample: z.string().optional(),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })).default([]),
  references: z.array(QuestionReferenceSchema).default([]),
  estimatedMinutes: z.number().int().positive(),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const SavedDiagramSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  diagramType: z.enum([
    'uml_activity',
    'uml_class',
    'uml_sequence',
    'uml_component',
    'use_case',
    'flowchart',
    'er_diagram',
    'ui_wireframe',
  ]),
  linkedQuestionId: z.string().optional(),
  nodesJson: z.string(),
  edgesJson: z.string(),
  updatedAt: z.string(),
});
export type SavedDiagram = z.infer<typeof SavedDiagramSchema>;

export const BackupBundleSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  app: z.literal('PrepCIT'),
  profile: UserProfileSchema,
  historicalRecords: z.array(HistoricalScoreRecordSchema),
  topicMastery: z.array(TopicMasterySchema),
  examAttempts: z.array(ExamAttemptSchema),
  responses: z.array(QuestionResponseSchema),
  studyActivities: z.array(StudyActivitySchema),
  studySources: z.array(StudySourceSchema),
  savedDiagrams: z.array(SavedDiagramSchema),
});
export type BackupBundle = z.infer<typeof BackupBundleSchema>;
