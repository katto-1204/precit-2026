import type { DomainId } from './blueprint2026';
import {
  HistoricalScoreRecordSchema,
  type HistoricalScoreRecord,
  type MasteryState,
  type TopicMastery,
} from './schemas';
import { SYLLABUS_2026_TOPICS, type HistoricalAreaId } from './syllabus2026';

export const VERIFIED_2025_BASELINE: HistoricalScoreRecord = HistoricalScoreRecordSchema.parse({
  id: 'baseline-2025-12-10',
  formatYear: 2025,
  label: 'Verified TOPCIT 2025 Score Report',
  examDate: '2025-12-10',
  totalScore: 197,
  maxScore: 1000,
  correctItems: 25,
  totalItems: 65,
  competencyLevel: 2,
  examineeAverage: 233.6,
  top30Reference: 413.0,
  top10Reference: 568.5,
  isVerifiedBaseline: true,
  sourceNote:
    'Verified historical 2025 examination baseline. Stored strictly as 2025 format evidence (65 items) and never converted into a synthetic 2026 score.',
  importedAt: '2026-01-01T00:00:00.000Z',
  areas: [
    {
      areaId: 'software',
      label: 'Software',
      earnedPoints: 45,
      maxPoints: 260,
      correctItems: 5,
      totalItems: 17,
    },
    {
      areaId: 'data',
      label: 'Data',
      earnedPoints: 52,
      maxPoints: 145,
      correctItems: 5,
      totalItems: 9,
    },
    {
      areaId: 'system_architecture',
      label: 'System Architecture',
      earnedPoints: 25,
      maxPoints: 75,
      correctItems: 4,
      totalItems: 8,
    },
    {
      areaId: 'information_security',
      label: 'Information Security',
      earnedPoints: 5,
      maxPoints: 85,
      correctItems: 1,
      totalItems: 8,
    },
    {
      areaId: 'it_business_ethics',
      label: 'IT Business & Ethics',
      earnedPoints: 20,
      maxPoints: 95,
      correctItems: 4,
      totalItems: 11,
    },
    {
      areaId: 'tech_comm_pm',
      label: 'Technical Communication & PM',
      earnedPoints: 35,
      maxPoints: 80,
      correctItems: 5,
      totalItems: 9,
    },
    {
      areaId: 'integrated_competencies',
      label: 'Integrated Competencies',
      earnedPoints: 15,
      maxPoints: 260,
      correctItems: 1,
      totalItems: 3,
    },
  ],
});

export interface HistoricalTo2026Mapping {
  readonly historicalAreaId: HistoricalAreaId;
  readonly historicalLabel: string;
  readonly targetDomains: readonly DomainId[];
  readonly isCrossDomainIntegrated: boolean;
  readonly mappingNote: string;
}

export const HISTORICAL_2025_TO_2026_BRIDGE: readonly HistoricalTo2026Mapping[] = [
  {
    historicalAreaId: 'integrated_competencies',
    historicalLabel: 'Integrated Competencies',
    targetDomains: ['M1', 'M2', 'M3'],
    isCrossDomainIntegrated: true,
    mappingNote:
      'Maps to 80-point Integrated Performance tasks embedded inside M1, M2, and M3 (not a standalone 2026 domain).',
  },
  {
    historicalAreaId: 'information_security',
    historicalLabel: 'Information Security',
    targetDomains: ['M3'],
    isCrossDomainIntegrated: false,
    mappingNote: 'Merged with System Architecture into M3 — Systems Architecture and Information Security.',
  },
  {
    historicalAreaId: 'software',
    historicalLabel: 'Software',
    targetDomains: ['M1'],
    isCrossDomainIntegrated: false,
    mappingNote: 'Maps directly to M1 — Software Development (expanded to 365 pts with AI & practical emphasis).',
  },
  {
    historicalAreaId: 'it_business_ethics',
    historicalLabel: 'IT Business & Ethics',
    targetDomains: ['M4'],
    isCrossDomainIntegrated: false,
    mappingNote: 'Merged with Technical Communication & PM into M4 — IT Business.',
  },
  {
    historicalAreaId: 'system_architecture',
    historicalLabel: 'System Architecture',
    targetDomains: ['M3'],
    isCrossDomainIntegrated: false,
    mappingNote: 'Merged with Information Security into M3 — Systems Architecture and Information Security.',
  },
  {
    historicalAreaId: 'data',
    historicalLabel: 'Data',
    targetDomains: ['M2'],
    isCrossDomainIntegrated: false,
    mappingNote: 'Maps directly to M2 — Data Management (expanded to 265 pts with SQL, modeling & data-driven AI).',
  },
  {
    historicalAreaId: 'tech_comm_pm',
    historicalLabel: 'Technical Communication & PM',
    targetDomains: ['M4'],
    isCrossDomainIntegrated: false,
    mappingNote: 'Merged with IT Business & Ethics into M4 — IT Business.',
  },
];

export interface WeaknessPriorityItem {
  readonly rank: number;
  readonly historicalAreaId: HistoricalAreaId;
  readonly title: string;
  readonly targetDomains: readonly DomainId[];
  readonly severity: 'critical' | 'high' | 'moderate' | 'maintain';
  readonly earnedPoints: number;
  readonly maxPoints: number;
  readonly scorePercent: number;
  readonly correctItems: number;
  readonly totalItems: number;
  readonly actionFocus: string;
}

const PRIORITY_ORDER: readonly {
  areaId: HistoricalAreaId;
  title: string;
  severity: WeaknessPriorityItem['severity'];
  actionFocus: string;
}[] = [
  {
    areaId: 'integrated_competencies',
    title: 'Integrated Problem Solving',
    severity: 'critical',
    actionFocus:
      'Practice multi-artifact 80-pt workplace scenarios combining UML/code (M1), SQL/schema (M2), and architecture/security (M3).',
  },
  {
    areaId: 'information_security',
    title: 'Information Security',
    severity: 'critical',
    actionFocus:
      'Rebuild fundamentals: CIA triad, symmetric/asymmetric crypto, PKI, OWASP Top 10, and secure architecture controls.',
  },
  {
    areaId: 'software',
    title: 'Software Development',
    severity: 'high',
    actionFocus:
      'Highest 2026 weight (365 pts). Prioritize UML modeling, algorithmic coding labs, and software testing/refactoring.',
  },
  {
    areaId: 'it_business_ethics',
    title: 'IT Business & Ethics',
    severity: 'high',
    actionFocus:
      'Drill IT strategy frameworks, enterprise systems (ERP/CRM), software licensing, privacy law, and ethical case analysis.',
  },
  {
    areaId: 'system_architecture',
    title: 'System Architecture',
    severity: 'moderate',
    actionFocus:
      'Strengthen OS scheduling/memory, TCP/IP subnetting, and cloud/high-availability distributed architecture.',
  },
  {
    areaId: 'data',
    title: 'Data Management',
    severity: 'moderate',
    actionFocus:
      'Convert strong 2025 foundation into 265-pt M2 mastery via complex SQL joins/CTEs, BCNF normalization, and indexing.',
  },
  {
    areaId: 'tech_comm_pm',
    title: 'Technical Communication & PM',
    severity: 'maintain',
    actionFocus:
      'Maintain edge with CPM/PERT calculations, risk registers, and concise 450-char descriptive requirement responses.',
  },
];

export function buildWeaknessPriorities(
  record: HistoricalScoreRecord = VERIFIED_2025_BASELINE,
): WeaknessPriorityItem[] {
  const areaById = new Map(record.areas.map((a) => [a.areaId, a]));
  const bridgeById = new Map(HISTORICAL_2025_TO_2026_BRIDGE.map((b) => [b.historicalAreaId, b]));

  return PRIORITY_ORDER.map((item, idx) => {
    const stats = areaById.get(item.areaId);
    const bridge = bridgeById.get(item.areaId);
    const earned = stats?.earnedPoints ?? 0;
    const max = stats?.maxPoints ?? 100;
    return {
      rank: idx + 1,
      historicalAreaId: item.areaId,
      title: item.title,
      targetDomains: bridge?.targetDomains ?? ['M1'],
      severity: item.severity,
      earnedPoints: earned,
      maxPoints: max,
      scorePercent: max > 0 ? (earned / max) * 100 : 0,
      correctItems: stats?.correctItems ?? 0,
      totalItems: stats?.totalItems ?? 0,
      actionFocus: item.actionFocus,
    };
  });
}

export interface DomainHistoricalEvidence {
  domain: DomainId;
  mappedAreas: {
    areaId: HistoricalAreaId;
    label: string;
    earnedPoints: number;
    maxPoints: number;
    scorePercent: number;
    correctItems: number;
    totalItems: number;
  }[];
  includesIntegratedCrossDomain: boolean;
  integratedBaselinePercent: number | null;
  combinedHistoricalEarned: number;
  combinedHistoricalMax: number;
  historicalWeightedPercent: number;
}

/**
 * Summarizes historical 2025 evidence mapped onto each 2026 domain WITHOUT fabricating a 2026 score.
 * Integrated Competencies is surfaced explicitly as a cross-domain indicator across M1, M2, and M3.
 */
export function getHistoricalEvidenceBy2026Domain(
  record: HistoricalScoreRecord = VERIFIED_2025_BASELINE,
): Record<DomainId, DomainHistoricalEvidence> {
  const areaById = new Map(record.areas.map((a) => [a.areaId, a]));
  const integrated = areaById.get('integrated_competencies');
  const integratedPercent =
    integrated && integrated.maxPoints > 0
      ? (integrated.earnedPoints / integrated.maxPoints) * 100
      : null;

  const directAreasByDomain: Record<DomainId, HistoricalAreaId[]> = {
    M1: ['software'],
    M2: ['data'],
    M3: ['system_architecture', 'information_security'],
    M4: ['it_business_ethics', 'tech_comm_pm'],
  };

  const result = {} as Record<DomainId, DomainHistoricalEvidence>;

  for (const domain of ['M1', 'M2', 'M3', 'M4'] as DomainId[]) {
    const mappedAreas = directAreasByDomain[domain]
      .map((areaId) => areaById.get(areaId))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map((a) => ({
        areaId: a.areaId,
        label: a.label,
        earnedPoints: a.earnedPoints,
        maxPoints: a.maxPoints,
        scorePercent: (a.earnedPoints / a.maxPoints) * 100,
        correctItems: a.correctItems,
        totalItems: a.totalItems,
      }));

    const combinedHistoricalEarned = mappedAreas.reduce((acc, a) => acc + a.earnedPoints, 0);
    const combinedHistoricalMax = mappedAreas.reduce((acc, a) => acc + a.maxPoints, 0);

    result[domain] = {
      domain,
      mappedAreas,
      includesIntegratedCrossDomain: domain !== 'M4',
      integratedBaselinePercent: domain !== 'M4' ? integratedPercent : null,
      combinedHistoricalEarned,
      combinedHistoricalMax,
      historicalWeightedPercent:
        combinedHistoricalMax > 0 ? (combinedHistoricalEarned / combinedHistoricalMax) * 100 : 0,
    };
  }

  return result;
}

function initialMasteryStateFromPrior(priorPercent: number): MasteryState {
  if (priorPercent < 22) return 'needs_foundation';
  if (priorPercent < 40) return 'developing';
  return 'practicing';
}

export function deriveInitialTopicMastery(
  record: HistoricalScoreRecord = VERIFIED_2025_BASELINE,
  nowIso: string = new Date().toISOString(),
): TopicMastery[] {
  const areaById = new Map(record.areas.map((a) => [a.areaId, a]));

  return SYLLABUS_2026_TOPICS.map((topic) => {
    const area = areaById.get(topic.mappedHistoricalArea);
    const priorPercent =
      area && area.maxPoints > 0
        ? Math.round(((area.earnedPoints / area.maxPoints) * 100) * 10) / 10
        : 20;

    return {
      topicId: topic.id,
      domain: topic.domain,
      state: initialMasteryStateFromPrior(priorPercent),
      competencyScore: Math.round(priorPercent),
      historicalPriorPercent: priorPercent,
      attemptsCount: 0,
      correctCount: 0,
      repeatErrorCount: 0,
      easeFactor: 2.3,
      intervalDays: priorPercent < 22 ? 1 : 2,
      nextReviewAt: nowIso,
      scheduleReason: `Seeded from verified 2025 ${area?.label ?? 'baseline'} score (${priorPercent.toFixed(1)}%). Needs 2026-format practice evidence.`,
    };
  });
}
