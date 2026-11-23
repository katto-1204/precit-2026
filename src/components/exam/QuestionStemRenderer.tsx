import React from 'react';
import { AlertTriangle, Database, Layers, ShieldAlert, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-brand-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function FormattedPromptText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {lines.map((raw, idx) => {
        const line = raw.trim();
        if (!line) return <div key={idx} className="h-1" />;
        if (line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <span>{renderInlineMarkdown(line.slice(2))}</span>
            </div>
          );
        }
        const numbered = line.match(/^(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-[11px] font-bold text-white">
                {numbered[1]}
              </span>
              <span className="min-w-0 flex-1">{renderInlineMarkdown(numbered[2])}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

/**
 * Renders authentic IBT visual exhibits (SVG topology/attack diagrams, EXPLAIN telemetry,
 * sample relational tables, EVM scorecards) matched to practical/descriptive/integrated items.
 */
function QuestionVisualExhibit({ questionId }: { questionId: string }) {
  if (questionId === 'M3-INT-01') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-800">
            <ShieldAlert className="h-4 w-4 text-brand-600" />
            Exhibit A — Observed Breach Attack Chain (02:14 UTC)
          </span>
          <Badge variant="danger">Severity: Critical</Badge>
        </div>

        <svg viewBox="0 0 640 120" className="w-full rounded border border-slate-200 bg-white p-2">
          <defs>
            <marker id="arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#c81e1e" />
            </marker>
          </defs>
          {[
            { x: 14, title: '1. Public Git Repo', sub: 'Hardcoded API Key', fill: '#fef2f2', stroke: '#c81e1e' },
            { x: 174, title: '2. Staging Server', sub: 'Exposed Query API', fill: '#fffbeb', stroke: '#d97706' },
            { x: 334, title: '3. Internal Lateral', sub: 'Open SSH Port 22', fill: '#fffbeb', stroke: '#d97706' },
            { x: 494, title: '4. Backup Dump', sub: 'Unsalted SHA-1 + PII', fill: '#fef2f2', stroke: '#c81e1e' },
          ].map((box, i) => (
            <g key={box.title}>
              <rect x={box.x} y="24" width="132" height="68" rx="8" fill={box.fill} stroke={box.stroke} strokeWidth="2" />
              <text x={box.x + 66} y="51" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                {box.title}
              </text>
              <text x={box.x + 66} y="70" textAnchor="middle" fontSize="10" fill="#475569">
                {box.sub}
              </text>
              {i < 3 ? (
                <line
                  x1={box.x + 132}
                  y1="58"
                  x2={box.x + 160}
                  y2="58"
                  stroke="#c81e1e"
                  strokeWidth="2"
                  markerEnd="url(#arr-red)"
                />
              ) : null}
            </g>
          ))}
        </svg>

        <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
          <div className="rounded border border-slate-200 bg-white p-2">
            <div className="text-slate-500">Compromised Vector</div>
            <div className="font-bold text-slate-900">Git Key + Port 22</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-2">
            <div className="text-slate-500">Exposed Hash Algo</div>
            <div className="font-bold text-red-700">Unsalted SHA-1</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-2">
            <div className="text-slate-500">Target Architecture</div>
            <div className="font-bold text-emerald-700">Zero-Trust + KMS</div>
          </div>
        </div>
      </div>
    );
  }

  if (questionId === 'M2-DESC-02') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
            <Terminal className="h-4 w-4 text-brand-600" />
            Exhibit A — Slow Query &amp; Production EXPLAIN Plan
          </span>
          <Badge variant="danger">Latency: 8.4s</Badge>
        </div>
        <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-xs leading-relaxed text-amber-200">
{`SELECT *
FROM orders
WHERE YEAR(created_at) = 2026
  AND status = 'SHIPPED'
ORDER BY total_amount DESC
LIMIT 20;`}
        </pre>
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-2.5 py-1.5">table</th>
                <th className="px-2.5 py-1.5">type</th>
                <th className="px-2.5 py-1.5">possible_keys</th>
                <th className="px-2.5 py-1.5">key</th>
                <th className="px-2.5 py-1.5">rows_scanned</th>
                <th className="px-2.5 py-1.5">Extra</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-red-700">
                <td className="px-2.5 py-1.5 font-semibold text-slate-900">orders</td>
                <td className="px-2.5 py-1.5 font-bold">ALL (Full Scan)</td>
                <td className="px-2.5 py-1.5 text-slate-500">NULL</td>
                <td className="px-2.5 py-1.5 font-bold">NULL</td>
                <td className="px-2.5 py-1.5 font-bold">15,000,000</td>
                <td className="px-2.5 py-1.5">Using where; Using filesort</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (questionId === 'M2-DESC-01') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
          <Database className="h-4 w-4 text-brand-600" />
          Exhibit A — Unnormalized OrderSheet Sample Rows
        </span>
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-2 py-1.5">order_id*</th>
                <th className="px-2 py-1.5">cust_id</th>
                <th className="px-2 py-1.5">cust_name</th>
                <th className="px-2 py-1.5">cust_city</th>
                <th className="px-2 py-1.5">product_id*</th>
                <th className="px-2 py-1.5">product_name</th>
                <th className="px-2 py-1.5">unit_price</th>
                <th className="px-2 py-1.5">qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-2 py-1.5">ORD-101</td>
                <td className="px-2 py-1.5">C-01</td>
                <td className="px-2 py-1.5">Ana Cruz</td>
                <td className="px-2 py-1.5 bg-amber-50">Manila</td>
                <td className="px-2 py-1.5">P-50</td>
                <td className="px-2 py-1.5">USB-C Hub</td>
                <td className="px-2 py-1.5">35.00</td>
                <td className="px-2 py-1.5">2</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">ORD-101</td>
                <td className="px-2 py-1.5">C-01</td>
                <td className="px-2 py-1.5">Ana Cruz</td>
                <td className="px-2 py-1.5 bg-amber-50">Manila</td>
                <td className="px-2 py-1.5">P-88</td>
                <td className="px-2 py-1.5">SSD 1TB</td>
                <td className="px-2 py-1.5">89.00</td>
                <td className="px-2 py-1.5">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (questionId === 'M1-INT-01') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
          <Layers className="h-4 w-4 text-brand-600" />
          Exhibit A — Library Borrower Policy Matrix
        </span>
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-1.5">Member Role</th>
                <th className="px-3 py-1.5">Max Concurrent Loans</th>
                <th className="px-3 py-1.5">Overdue Fine / Day</th>
                <th className="px-3 py-1.5">Grace Period</th>
                <th className="px-3 py-1.5">Max Fine Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="px-3 py-1.5 font-sans font-semibold">Student</td>
                <td className="px-3 py-1.5">5 books</td>
                <td className="px-3 py-1.5">$0.50</td>
                <td className="px-3 py-1.5">2 days</td>
                <td className="px-3 py-1.5">$25.00</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-sans font-semibold">Faculty</td>
                <td className="px-3 py-1.5">15 books</td>
                <td className="px-3 py-1.5">$0.25</td>
                <td className="px-3 py-1.5">2 days</td>
                <td className="px-3 py-1.5">$25.00</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-sans font-semibold">Guest</td>
                <td className="px-3 py-1.5">2 books</td>
                <td className="px-3 py-1.5">$1.00</td>
                <td className="px-3 py-1.5">2 days</td>
                <td className="px-3 py-1.5">$25.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (questionId === 'M3-PERF-01') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Exhibit A — Required Network Security Zones (Target SLA: 99.95%)
          </span>
          <Badge variant="info">Use Diagram Studio →</Badge>
        </div>
        <svg viewBox="0 0 600 96" className="w-full rounded border border-slate-200 bg-white p-1.5">
          <rect x="8" y="14" width="110" height="68" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeDasharray="4 3" />
          <text x="63" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">Public Internet</text>
          <text x="63" y="62" textAnchor="middle" fontSize="9.5" fill="#64748b">HTTPS :443</text>

          <rect x="142" y="14" width="136" height="68" rx="6" fill="#fef2f2" stroke="#c81e1e" />
          <text x="210" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9b1c1c">DMZ Subnet</text>
          <text x="210" y="62" textAnchor="middle" fontSize="9.5" fill="#7f1d1d">WAF + Redundant LB</text>

          <rect x="302" y="14" width="136" height="68" rx="6" fill="#f0f9ff" stroke="#0284c7" />
          <text x="370" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#075985">App Subnet</text>
          <text x="370" y="62" textAnchor="middle" fontSize="9.5" fill="#0369a1">2+ Stateless Servers</text>

          <rect x="462" y="14" width="130" height="68" rx="6" fill="#ecfdf5" stroke="#059669" />
          <text x="527" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#065f46">Private Data Zone</text>
          <text x="527" y="62" textAnchor="middle" fontSize="9.5" fill="#047857">Primary+Standby DB</text>
        </svg>
      </div>
    );
  }

  if (questionId === 'M4-DESC-01') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Exhibit A — Month 4 Earned Value Telemetry (Deadline: Month 6 Fixed)
        </span>
        <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
          <div className="rounded border border-slate-200 bg-white p-2.5">
            <div className="text-[11px] text-slate-500">Planned Value (PV)</div>
            <div className="text-base font-bold text-slate-900">$400,000</div>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50 p-2.5">
            <div className="text-[11px] text-amber-800">Earned Value (EV)</div>
            <div className="text-base font-bold text-amber-900">$320,000</div>
          </div>
          <div className="rounded border border-red-200 bg-red-50 p-2.5">
            <div className="text-[11px] text-red-700">Actual Cost (AC)</div>
            <div className="text-base font-bold text-red-800">$440,000</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface QuestionStemRendererProps {
  questionId: string;
  prompt: string;
}

export function QuestionStemRenderer({ questionId, prompt }: QuestionStemRendererProps) {
  return (
    <div className="space-y-4">
      <QuestionVisualExhibit questionId={questionId} />
      <FormattedPromptText text={prompt} />
    </div>
  );
}
