import { describe, expect, it } from 'vitest';
import { deriveInitialTopicMastery, VERIFIED_2025_BASELINE } from '@/domain/historicalBaseline';
import {
  generateDailyRecommendations,
  updateTopicMastery,
} from '@/domain/learningEngine';

describe('Personalized learning engine & anti-easy-MCQ recommendations', () => {
  it('updates mastery score, SM-2 review interval, and repeat error counts transparently', () => {
    const initial = deriveInitialTopicMastery(VERIFIED_2025_BASELINE)[0];

    const afterMiss = updateTopicMastery({
      current: initial,
      earnedPoints: 0,
      maxPoints: 30,
      difficulty: 'medium',
      questionType: 'descriptive',
      responseTimeSeconds: 400,
      estimatedSeconds: 450,
    });
    expect(afterMiss.repeatErrorCount).toBe(1);
    expect(afterMiss.intervalDays).toBe(1);

    const afterPass = updateTopicMastery({
      current: afterMiss,
      earnedPoints: 45,
      maxPoints: 50,
      difficulty: 'hard',
      questionType: 'standard_performance',
      responseTimeSeconds: 600,
      estimatedSeconds: 900,
    });
    expect(afterPass.competencyScore).toBeGreaterThan(afterMiss.competencyScore);
    expect(afterPass.repeatErrorCount).toBe(0);
  });

  it('never recommends only easy MCQs; enforces practical/integrated and descriptive tasks', () => {
    const masteries = deriveInitialTopicMastery(VERIFIED_2025_BASELINE);
    const recs = generateDailyRecommendations(masteries, 4);

    expect(recs.length).toBe(4);
    expect(recs.some((r) => r.targetQuestionType === 'integrated_performance')).toBe(true);
    expect(recs.some((r) => r.targetQuestionType === 'descriptive')).toBe(true);
    expect(recs.every((r) => r.targetDifficulty !== 'easy')).toBe(true);
  });
});
