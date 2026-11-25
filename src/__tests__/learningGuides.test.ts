import { describe, expect, it } from 'vitest';
import { CODING_CHALLENGES, SQL_CHALLENGES } from '@/data/labChallenges';
import {
  CODING_CHALLENGE_COACHING,
  DIAGRAM_COACHING,
  SQL_CHALLENGE_COACHING,
  SQL_TUTORIAL_RECIPES,
  generateQuestionHints,
  getIntegratedCoach,
} from '@/data/learningGuides';
import { ALL_SEED_QUESTIONS } from '@/data/questions';
import { DIAGRAM_CATEGORIES, evaluateDiagramGraph } from '@/domain/diagramSpecs';

describe('Zero-Intimidation Hints, Tutorials & Ready-Made Examples', () => {
  it('provides plain-English coaching and 3 progressive hints for every SQL & Coding challenge', () => {
    for (const ch of SQL_CHALLENGES) {
      const coach = SQL_CHALLENGE_COACHING[ch.id];
      expect(coach).toBeDefined();
      expect(coach.situationPlainEnglish.length).toBeGreaterThan(40);
      expect(coach.hints).toHaveLength(3);
      expect(coach.guidedFillBlankSql).toContain('/* ???');
      expect(coach.workedExampleSql).toContain('SELECT');
    }

    for (const ch of CODING_CHALLENGES) {
      const coach = CODING_CHALLENGE_COACHING[ch.id];
      expect(coach).toBeDefined();
      expect(coach.situationPlainEnglish.length).toBeGreaterThan(40);
      expect(coach.hints).toHaveLength(3);
      expect(coach.guidedFillBlankPython.length).toBeGreaterThan(50);
    }

    expect(SQL_TUTORIAL_RECIPES.length).toBeGreaterThanOrEqual(5);
  });

  it('provides valid worked example diagrams for all 8 TOPCIT categories that score strongly on Validate', () => {
    for (const cat of DIAGRAM_CATEGORIES) {
      const coach = DIAGRAM_COACHING[cat.id];
      expect(coach).toBeDefined();
      expect(coach.hints).toHaveLength(3);
      expect(coach.workedNodes.length).toBeGreaterThanOrEqual(3);
      expect(coach.workedEdges.length).toBeGreaterThanOrEqual(1);

      const evalRes = evaluateDiagramGraph(cat.id, coach.workedNodes, coach.workedEdges, 50);
      expect(
        evalRes.earnedPoints,
        `${cat.id} worked example score (${evalRes.earnedPoints}/50) missing: ${evalRes.missingChecks.join('; ')} warnings: ${evalRes.warnings.join('; ')}`,
      ).toBe(50);
    }
  });

  it('generates 3 non-spoiler progressive hints for Practice Hub & Integrated scenarios', () => {
    const sampleMcq = ALL_SEED_QUESTIONS.find((q) => q.questionType === 'mcq')!;
    const mcqHints = generateQuestionHints(sampleMcq);
    expect(mcqHints.hints).toHaveLength(3);
    expect(mcqHints.outlineStarter).toBeUndefined();

    const sampleDesc = ALL_SEED_QUESTIONS.find((q) => q.questionType === 'descriptive')!;
    const descHints = generateQuestionHints(sampleDesc);
    expect(descHints.hints).toHaveLength(3);
    expect(descHints.outlineStarter).toBeTruthy();

    const sampleInt = ALL_SEED_QUESTIONS.find((q) => q.questionType === 'integrated_performance')!;
    const intCoach = getIntegratedCoach(sampleInt);
    expect(intCoach.hints).toHaveLength(3);
    expect(intCoach.guidedOutlineTemplate).toContain('1.');
  });
});
