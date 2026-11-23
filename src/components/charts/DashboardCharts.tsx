import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BLUEPRINT_2026, type DomainId } from '@/domain/blueprint2026';
import type { ExamAttempt, HistoricalScoreRecord, TopicMastery } from '@/domain/schemas';

interface DomainMasteryChartProps {
  topicMastery: readonly TopicMastery[];
}

export function DomainMasteryChart({ topicMastery }: DomainMasteryChartProps) {
  const data = BLUEPRINT_2026.domainOrder.map((domainId: DomainId) => {
    const spec = BLUEPRINT_2026.domains[domainId];
    const topics = topicMastery.filter((t) => t.domain === domainId);
    const avgScore =
      topics.length > 0
        ? Math.round(topics.reduce((acc, t) => acc + t.competencyScore, 0) / topics.length)
        : 0;

    return {
      domain: domainId,
      name: spec.shortName,
      competency: avgScore,
      points: spec.totalPoints,
    };
  });

  return (
    <div className="h-64 w-full" aria-label="2026 domain mastery bar chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="domain"
            tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, _name, item) => [
              `${value}% est. competency (${item.payload.points} exam pts)`,
              item.payload.name,
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}
          />
          <ReferenceLine
            y={40}
            stroke="#c81e1e"
            strokeDasharray="4 4"
            label={{
              value: 'L3 Floor (40%)',
              position: 'insideTopRight',
              fill: '#c81e1e',
              fontSize: 10,
            }}
          />
          <Bar dataKey="competency" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell
                key={entry.domain}
                fill={
                  entry.competency < 25
                    ? '#c81e1e'
                    : entry.competency < 40
                      ? '#d97706'
                      : '#0f172a'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ScoreTrendChartProps {
  historicalRecords: readonly HistoricalScoreRecord[];
  examAttempts: readonly ExamAttempt[];
  targetScore: number;
  examineeAverage?: number;
  top30Reference?: number;
}

export function ScoreTrendChart({
  historicalRecords,
  examAttempts,
  targetScore,
  examineeAverage = 233.6,
  top30Reference = 413.0,
}: ScoreTrendChartProps) {
  const historicalPoints = [...historicalRecords]
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .map((rec) => ({
      label: `${rec.examDate} (2025)`,
      score: rec.totalScore,
      format: '2025 Historical (65Q)',
    }));

  const mockPoints = examAttempts
    .filter(
      (a) =>
        a.mode === 'full_mock_2026' &&
        a.status === 'submitted' &&
        a.pendingPoints === 0 &&
        a.completedAt,
    )
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
    .map((a, idx) => ({
      label: `2026 Mock #${idx + 1}`,
      score: Math.round(a.evaluatedPoints),
      format: '2026 Mock (75Q)',
    }));

  const chartData = [
    ...historicalPoints,
    ...mockPoints,
    ...(mockPoints.length === 0
      ? [
          {
            label: 'Target Goal',
            score: null as number | null,
            format: 'Pending first 2026 Mock',
          },
        ]
      : []),
  ];

  return (
    <div className="h-64 w-full" aria-label="Score progression and benchmark chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
        <LineChart data={chartData} margin={{ top: 14, right: 20, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#475569' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 700]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number | string) => [`${value} / 1,000 pts`, 'Recorded Score']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}
          />
          <ReferenceLine
            y={examineeAverage}
            stroke="#64748b"
            strokeDasharray="3 3"
            label={{
              value: `2025 Avg (${examineeAverage})`,
              position: 'insideBottomRight',
              fill: '#64748b',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={top30Reference}
            stroke="#0284c7"
            strokeDasharray="4 4"
            label={{
              value: `Top 30% (${top30Reference})`,
              position: 'insideTopRight',
              fill: '#0284c7',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={targetScore}
            stroke="#c81e1e"
            strokeWidth={1.5}
            label={{
              value: `Target (${targetScore})`,
              position: 'insideTopLeft',
              fill: '#c81e1e',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#c81e1e"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#c81e1e', stroke: '#ffffff', strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
