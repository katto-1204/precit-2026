import { describe, expect, it } from 'vitest';
import {
  BLUEPRINT_2026,
  getCompetencyLevel,
  validateExamBlueprint,
  type BlueprintQuestionLike,
  type DomainId,
  type QuestionType,
} from '@/domain/blueprint2026';

function buildValid75QuestionMock(): BlueprintQuestionLike[] {
  const items: BlueprintQuestionLike[] = [];
  let seq = 1;

  for (const domain of BLUEPRINT_2026.domainOrder) {
    const counts = BLUEPRINT_2026.domains[domain].counts;
    for (const qType of Object.keys(counts) as QuestionType[]) {
      const n = counts[qType];
      const pts = BLUEPRINT_2026.pointsByType[qType];
      for (let i = 0; i < n; i += 1) {
        items.push({
          id: `q-${domain}-${qType}-${seq++}`,
          domain: domain as DomainId,
          questionType: qType,
          pointValue: pts,
          ...(qType === 'mcq'
            ? {
                options: [
                  { id: 'A', text: 'Option A' },
                  { id: 'B', text: 'Option B' },
                  { id: 'C', text: 'Option C' },
                  { id: 'D', text: 'Option D' },
                ],
                correctOptionId: 'A',
              }
            : {
                rubric: [{ maxPoints: pts }],
              }),
        });
      }
    }
  }
  return items;
}

describe('BLUEPRINT_2026 specification & validator', () => {
  it('enforces exact 2026 totals: 75 questions, 1,000 points, 150 minutes, 4 domains', () => {
    expect(BLUEPRINT_2026.totalQuestions).toBe(75);
    expect(BLUEPRINT_2026.totalPoints).toBe(1000);
    expect(BLUEPRINT_2026.durationMinutes).toBe(150);
    expect(BLUEPRINT_2026.domainOrder).toEqual(['M1', 'M2', 'M3', 'M4']);

    const domainPointsSum = BLUEPRINT_2026.domainOrder.reduce(
      (sum, d) => sum + BLUEPRINT_2026.domains[d].totalPoints,
      0,
    );
    const domainQuestionsSum = BLUEPRINT_2026.domainOrder.reduce(
      (sum, d) => sum + BLUEPRINT_2026.domains[d].totalQuestions,
      0,
    );
    expect(domainPointsSum).toBe(1000);
    expect(domainQuestionsSum).toBe(75);
    expect(BLUEPRINT_2026.domains.M1.totalPoints).toBe(365);
    expect(BLUEPRINT_2026.domains.M2.totalPoints).toBe(265);
    expect(BLUEPRINT_2026.domains.M3.totalPoints).toBe(235);
    expect(BLUEPRINT_2026.domains.M4.totalPoints).toBe(135);
  });

  it('validates a compliant 75-item 2026 exam configuration', () => {
    const validMock = buildValid75QuestionMock();
    const result = validateExamBlueprint(validMock);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.totalQuestions).toBe(75);
    expect(result.totalPoints).toBe(1000);
  });

  it('rejects duplicate question IDs, missing items, wrong points, and rubric mismatches', () => {
    const broken = buildValid75QuestionMock();
    broken[1].id = broken[0].id; // duplicate ID
    broken[2].pointValue = 10; // wrong MCQ point value
    const descriptive = broken.find((q) => q.questionType === 'descriptive')!;
    descriptive.rubric = [{ maxPoints: 20 }]; // rubric sum 20 != 30
    broken.pop(); // 74 items instead of 75

    const result = validateExamBlueprint(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate question ID'))).toBe(true);
    expect(result.errors.some((e) => e.includes('rubric sums to 20'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Total questions is 74'))).toBe(true);
  });

  it('maps scores to official TOPCIT competency levels 1 through 5', () => {
    expect(getCompetencyLevel(120).level).toBe(1);
    expect(getCompetencyLevel(197).level).toBe(2);
    expect(getCompetencyLevel(400).level).toBe(3);
    expect(getCompetencyLevel(650).level).toBe(4);
    expect(getCompetencyLevel(850).level).toBe(5);
  });
});
