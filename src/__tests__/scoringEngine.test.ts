import { describe, expect, it } from 'vitest';
import type { Question, QuestionResponse } from '@/domain/schemas';
import {
  evaluateSingleResponse,
  projectQuestionForActiveExam,
  scoreExamAttempt,
} from '@/domain/scoringEngine';

const sampleMcq: Question = {
  id: 'q-mcq-1',
  title: 'ACID Isolation',
  prompt: 'Which SQL isolation level prevents phantom reads according to the SQL standard?',
  domain: 'M2',
  topicId: 'M2-SQL',
  difficulty: 'medium',
  questionType: 'mcq',
  pointValue: 5,
  options: [
    { id: 'A', text: 'READ UNCOMMITTED' },
    { id: 'B', text: 'READ COMMITTED' },
    { id: 'C', text: 'REPEATABLE READ' },
    { id: 'D', text: 'SERIALIZABLE' },
  ],
  correctOptionId: 'D',
  explanation: 'SERIALIZABLE prevents dirty, non-repeatable, and phantom reads.',
  references: [],
  sourceClassification: 'original_practice',
  contentVersion: '1.0.0',
  reviewStatus: 'verified',
  estimatedSeconds: 60,
};

const samplePractical: Question = {
  id: 'q-perf-1',
  title: 'Rate Limiter Implementation',
  prompt: 'Implement a token-bucket rate limiter function in Python passing all edge cases.',
  domain: 'M1',
  topicId: 'M1-ALG',
  difficulty: 'hard',
  questionType: 'standard_performance',
  practicalSubtype: 'coding',
  pointValue: 50,
  expectedResponse: 'Reference token bucket implementation',
  rubric: [
    { id: 'r1', label: 'Core Logic', description: 'Refills tokens properly', maxPoints: 30 },
    { id: 'r2', label: 'Edge Cases', description: 'Handles zero/negative input', maxPoints: 20 },
  ],
  sampleTestCases: [
    { id: 't1', input: '5 1', expectedOutput: 'True', isHidden: false, points: 25 },
    { id: 't2', input: '0 1', expectedOutput: 'False', isHidden: true, points: 25 },
  ],
  explanation: 'Track elapsed time and clamp tokens to bucket capacity.',
  references: [],
  sourceClassification: 'original_practice',
  contentVersion: '1.0.0',
  reviewStatus: 'verified',
  estimatedSeconds: 900,
};

describe('Scoring engine invariants & exam security guard', () => {
  it('strips answers, explanations, rubrics, and hidden tests during active exam', () => {
    const activeMcq = projectQuestionForActiveExam(sampleMcq);
    expect('correctOptionId' in activeMcq).toBe(false);
    expect('explanation' in activeMcq).toBe(false);

    const activePerf = projectQuestionForActiveExam(samplePractical);
    expect('rubric' in activePerf).toBe(false);
    expect('expectedResponse' in activePerf).toBe(false);
    expect(activePerf.sampleTestCases?.length).toBe(1);
    expect(activePerf.sampleTestCases?.[0].id).toBe('t1');
  });

  it('never automatically awards points to an unfinished practical task', () => {
    const blankResponse: QuestionResponse = {
      id: 'r-blank',
      attemptId: 'att-1',
      questionId: samplePractical.id,
      codeAnswer: '   ',
      isFlagged: false,
      timeSpentSeconds: 120,
      evaluationStatus: 'auto_graded',
      earnedPoints: 50, // even if corrupted/stale, blank submission must receive 0
      updatedAt: new Date().toISOString(),
    };

    const result = evaluateSingleResponse(samplePractical, blankResponse);
    expect(result.evaluationStatus).toBe('unanswered');
    expect(result.earnedPoints).toBe(0);
    expect(result.pendingPoints).toBe(0);
  });

  it('tracks submitted ungraded practical tasks as pending_evaluation separately from earned score', () => {
    const responses: QuestionResponse[] = [
      {
        id: 'r-1',
        attemptId: 'att-1',
        questionId: sampleMcq.id,
        selectedOptionId: 'D',
        isFlagged: false,
        timeSpentSeconds: 45,
        evaluationStatus: 'unanswered',
        earnedPoints: 0,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'r-2',
        attemptId: 'att-1',
        questionId: samplePractical.id,
        codeAnswer: 'def allow(): return True',
        isFlagged: false,
        timeSpentSeconds: 300,
        evaluationStatus: 'pending_evaluation',
        earnedPoints: 0,
        updatedAt: new Date().toISOString(),
      },
    ];

    const report = scoreExamAttempt([sampleMcq, samplePractical], responses);
    expect(report.evaluatedPoints).toBe(5);
    expect(report.pendingPoints).toBe(50);
    expect(report.pendingCount).toBe(1);
    expect(report.isFullyEvaluated).toBe(false);
    expect(report.finalWeightedScoreOutOf1000).toBeNull();
    expect(report.rawItemAccuracyPercent).toBe(100); // 1/1 evaluated item correct
  });
});
