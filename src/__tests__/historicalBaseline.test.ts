import { describe, expect, it } from 'vitest';
import {
  VERIFIED_2025_BASELINE,
  buildWeaknessPriorities,
  deriveInitialTopicMastery,
  getHistoricalEvidenceBy2026Domain,
} from '@/domain/historicalBaseline';
import { HistoricalScoreRecordSchema } from '@/domain/schemas';

describe('Historical 2025 baseline reconciliation & 2026 mapping', () => {
  it('reconciles the verified December 10, 2025 baseline to 197/1000 and 25/65', () => {
    const parsed = HistoricalScoreRecordSchema.safeParse(VERIFIED_2025_BASELINE);
    expect(parsed.success).toBe(true);

    const earnedSum = VERIFIED_2025_BASELINE.areas.reduce((s, a) => s + a.earnedPoints, 0);
    const maxSum = VERIFIED_2025_BASELINE.areas.reduce((s, a) => s + a.maxPoints, 0);
    const correctSum = VERIFIED_2025_BASELINE.areas.reduce((s, a) => s + a.correctItems, 0);
    const itemsSum = VERIFIED_2025_BASELINE.areas.reduce((s, a) => s + a.totalItems, 0);

    expect(earnedSum).toBe(197);
    expect(maxSum).toBe(1000);
    expect(correctSum).toBe(25);
    expect(itemsSum).toBe(65);
    expect(VERIFIED_2025_BASELINE.competencyLevel).toBe(2);
  });

  it('rejects historical imports whose category totals fail to reconcile', () => {
    const badPoints = {
      ...VERIFIED_2025_BASELINE,
      totalScore: 250, // areas still sum to 197
    };
    expect(HistoricalScoreRecordSchema.safeParse(badPoints).success).toBe(false);

    const badItems = {
      ...VERIFIED_2025_BASELINE,
      correctItems: 30, // areas still sum to 25
    };
    expect(HistoricalScoreRecordSchema.safeParse(badItems).success).toBe(false);
  });

  it('preserves exact initial weakness priority ranking 1 through 7', () => {
    const priorities = buildWeaknessPriorities(VERIFIED_2025_BASELINE);
    expect(priorities.map((p) => p.historicalAreaId)).toEqual([
      'integrated_competencies',
      'information_security',
      'software',
      'it_business_ethics',
      'system_architecture',
      'data',
      'tech_comm_pm',
    ]);
    expect(priorities[0].targetDomains).toEqual(['M1', 'M2', 'M3']);
  });

  it('maps Integrated Competencies across M1, M2, and M3 (not M4 or a 5th domain)', () => {
    const evidence = getHistoricalEvidenceBy2026Domain(VERIFIED_2025_BASELINE);
    expect(Object.keys(evidence)).toEqual(['M1', 'M2', 'M3', 'M4']);
    expect(evidence.M1.includesIntegratedCrossDomain).toBe(true);
    expect(evidence.M2.includesIntegratedCrossDomain).toBe(true);
    expect(evidence.M3.includesIntegratedCrossDomain).toBe(true);
    expect(evidence.M4.includesIntegratedCrossDomain).toBe(false);
    expect(evidence.M3.mappedAreas.map((a) => a.areaId)).toEqual([
      'system_architecture',
      'information_security',
    ]);
  });

  it('seeds initial topic mastery for all 19 syllabus topics from historical priors', () => {
    const mastery = deriveInitialTopicMastery(VERIFIED_2025_BASELINE);
    expect(mastery.length).toBe(19);
    const secTopic = mastery.find((m) => m.topicId === 'M3-SEC-FUND');
    expect(secTopic?.state).toBe('needs_foundation');
  });
});
