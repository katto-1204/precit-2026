import { describe, expect, it } from 'vitest';
import { SEED_LESSONS } from '@/data/lessons_seed';
import {
  ALL_SEED_QUESTIONS,
  MOCK_2026_SET_1,
  verifySeedQuestionBank,
} from '@/data/questions';
import { BLUEPRINT_2026 } from '@/domain/blueprint2026';

describe('Seeded 2026 75-question mock bank & study lessons', () => {
  it('passes full Zod QuestionSchema and 2026 Blueprint validation with 0 errors', () => {
    const { schemaErrors, blueprintResult } = verifySeedQuestionBank();

    expect(schemaErrors).toEqual([]);
    expect(blueprintResult.valid).toBe(true);
    expect(blueprintResult.errors).toEqual([]);
    expect(blueprintResult.totalQuestions).toBe(75);
    expect(blueprintResult.totalPoints).toBe(1000);

    expect(blueprintResult.byDomain.M1).toEqual({
      count: 21,
      points: 365,
      byType: { mcq: 15, descriptive: 2, standard_performance: 3, integrated_performance: 1 },
    });
    expect(blueprintResult.byDomain.M2).toEqual({
      count: 19,
      points: 265,
      byType: { mcq: 15, descriptive: 2, standard_performance: 1, integrated_performance: 1 },
    });
    expect(blueprintResult.byDomain.M3).toEqual({
      count: 18,
      points: 235,
      byType: { mcq: 15, descriptive: 1, standard_performance: 1, integrated_performance: 1 },
    });
    expect(blueprintResult.byDomain.M4).toEqual({
      count: 17,
      points: 135,
      byType: { mcq: 15, descriptive: 2, standard_performance: 0, integrated_performance: 0 },
    });
  });

  it('tags all seeded items as verified original practice with no duplicate IDs', () => {
    const ids = new Set(ALL_SEED_QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(ALL_SEED_QUESTIONS.length);
    expect(MOCK_2026_SET_1.length).toBe(BLUEPRINT_2026.totalQuestions);
    expect(ALL_SEED_QUESTIONS.every((q) => q.sourceClassification === 'original_practice')).toBe(true);
    expect(ALL_SEED_QUESTIONS.every((q) => q.reviewStatus === 'verified')).toBe(true);
  });

  it('provides lessons with worked examples and glossary across all 4 domains', () => {
    const coveredDomains = new Set(SEED_LESSONS.map((l) => l.domain));
    expect(coveredDomains).toEqual(new Set(['M1', 'M2', 'M3', 'M4']));
    expect(SEED_LESSONS.every((l) => l.glossary.length >= 3)).toBe(true);
  });
});
