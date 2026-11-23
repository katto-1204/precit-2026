import { lazy, Suspense, useState } from 'react';
import { Play, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { executeCode, type ExecutionResult } from '@/lib/codeRunner';
import { executeSqlQuery, type SqlQueryResult } from '@/lib/sqlRunner';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

interface EmbeddedExamCodeWorkspaceProps {
  mode: 'coding' | 'sql';
  value: string;
  onChange: (nextCode: string) => void;
  defaultStdin?: string;
  schemaSql?: string;
}

/**
 * Embedded live execution workspace for CBT Full Mock practical items.
 * Lets candidates run Python (Pyodide Worker) or SQL (sql.js WASM) against visible input/schema
 * during the exam WITHOUT exposing hidden tests, solutions, or explanations.
 */
export function EmbeddedExamCodeWorkspace({
  mode,
  value,
  onChange,
  defaultStdin = '',
  schemaSql = '',
}: EmbeddedExamCodeWorkspaceProps) {
  const [stdin, setStdin] = useState(defaultStdin);
  const [running, setRunning] = useState(false);
  const [codeResult, setCodeResult] = useState<ExecutionResult | null>(null);
  const [sqlResult, setSqlResult] = useState<SqlQueryResult | null>(null);

  async function handleRun() {
    setRunning(true);
    try {
      if (mode === 'sql') {
        const res = await executeSqlQuery(schemaSql, value);
        setSqlResult(res);
      } else {
        const res = await executeCode('python', value, stdin);
        setCodeResult(res);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">
          {mode === 'sql'
            ? 'Live SQLite WASM Query Editor (sql.js)'
            : 'Live Python 3 Editor (Isolated Pyodide Worker)'}
        </span>
        <Button size="sm" variant="secondary" disabled={running} onClick={() => void handleRun()}>
          <Play className="h-3.5 w-3.5" />
          {running ? 'Executing...' : mode === 'sql' ? 'Run SQL Query' : 'Run Python Code'}
        </Button>
      </div>

      <div className="h-[280px] overflow-hidden rounded-md border border-slate-300 bg-[#1e1e1e]">
        <Suspense
          fallback={
            <textarea
              aria-label="Code or SQL solution editor"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="h-full w-full bg-slate-900 p-3 font-mono text-xs text-slate-100"
            />
          }
        >
          <MonacoEditor
            height="280px"
            language={mode === 'sql' ? 'sql' : 'python'}
            theme="vs-dark"
            value={value}
            onChange={(v) => onChange(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </Suspense>
      </div>

      {mode === 'coding' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Custom Test Input (stdin)
            </label>
            <textarea
              aria-label="Exam custom stdin"
              rows={4}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white p-2 font-mono text-xs"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Terminal className="h-3 w-3 text-brand-600" /> Output Console
              </span>
              {codeResult ? <span className="font-mono">{codeResult.elapsedMs}ms</span> : null}
            </div>
            <div className="h-[92px] overflow-auto rounded border border-slate-200 bg-slate-900 p-2 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
              {codeResult
                ? codeResult.stderr
                  ? `ERR: ${codeResult.stderr}\n${codeResult.stdout}`
                  : codeResult.stdout || '(No stdout)'
                : 'Click "Run Python Code" to test against custom stdin.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded border border-slate-200 bg-white overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600">
            <span>Query Result Preview</span>
            {sqlResult ? (
              <span className="font-mono">
                {sqlResult.rows.length} row(s) · {sqlResult.elapsedMs}ms
              </span>
            ) : null}
          </div>
          {sqlResult?.error ? (
            <p className="p-3 font-mono text-xs text-red-700 bg-red-50">{sqlResult.error}</p>
          ) : sqlResult && sqlResult.columns.length > 0 ? (
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {sqlResult.columns.map((c) => (
                    <th key={c} className="px-2.5 py-1.5 font-semibold text-slate-700">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sqlResult.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-2.5 py-1.5 text-slate-800">
                        {cell === null ? 'NULL' : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-3 text-xs text-slate-400">
              Click "Run SQL Query" to execute against the isolated SQLite practice database.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
