import type { CodingTestCase, CompilerLanguage } from '@/data/labChallenges';

export interface ExecutionResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  elapsedMs: number;
  timedOut?: boolean;
  runtimeUnavailable?: boolean;
}

export interface TestCaseGrade {
  testCaseId: string;
  isHidden: boolean;
  description: string;
  passed: boolean;
  pointsEarned: number;
  maxPoints: number;
  elapsedMs: number;
  actualOutput?: string;
  expectedOutput?: string;
  stderr?: string;
}

export interface CodingGradeSummary {
  earnedPoints: number;
  maxPoints: number;
  passedCount: number;
  totalCount: number;
  results: TestCaseGrade[];
  runtimeUnavailable?: boolean;
  errorMessage?: string;
}

export type PythonRuntimeStatus = 'idle' | 'loading' | 'ready' | 'error';

const DEFAULT_SANDBOX_URL =
  (import.meta.env.VITE_SANDBOX_URL as string | undefined) ||
  'http://localhost:8787/api/execute';

let sharedPythonWorker: Worker | null = null;
let currentPythonStatus: PythonRuntimeStatus = 'idle';
const statusListeners = new Set<(status: PythonRuntimeStatus) => void>();

function setPythonStatus(next: PythonRuntimeStatus) {
  currentPythonStatus = next;
  for (const fn of statusListeners) {
    fn(next);
  }
}

export function subscribePythonRuntimeStatus(
  listener: (status: PythonRuntimeStatus) => void,
): () => void {
  statusListeners.add(listener);
  listener(currentPythonStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

function ensurePythonWorker(): Worker {
  if (!sharedPythonWorker) {
    sharedPythonWorker = new Worker(
      new URL('../workers/pyodide.worker.ts', import.meta.url),
      { type: 'module' },
    );
    sharedPythonWorker.addEventListener(
      'message',
      (e: MessageEvent<{ type?: string; status?: PythonRuntimeStatus }>) => {
        if (e.data?.type === 'runtime_status' && e.data.status) {
          setPythonStatus(e.data.status);
        }
      },
    );
  }
  return sharedPythonWorker;
}

function resetPythonWorker() {
  if (sharedPythonWorker) {
    sharedPythonWorker.terminate();
    sharedPythonWorker = null;
  }
  setPythonStatus('idle');
}

/**
 * Quietly preloads Pyodide in the background when the user visits the Coding Lab
 * so clicking "Run Code" executes immediately instead of waiting on a cold download.
 */
export function warmupPythonRuntime(): void {
  if (typeof Worker === 'undefined') return;
  if (currentPythonStatus === 'ready' || currentPythonStatus === 'loading') return;
  const worker = ensurePythonWorker();
  setPythonStatus('loading');
  worker.postMessage({ type: 'warmup' });
}

/**
 * Executes Python 3 inside an isolated Pyodide Web Worker using a 2-stage timeout:
 * - Stage 1 (bootTimeoutMs = 45s): generous first-time Pyodide WASM download window.
 * - Stage 2 (timeoutMs = 6s): strict code execution guard that starts ONLY after Pyodide is loaded.
 */
export function runPythonInWorker(
  code: string,
  stdin: string,
  timeoutMs = 6000,
  bootTimeoutMs = 45000,
): Promise<ExecutionResult> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve({
      ok: false,
      stdout: '',
      stderr: 'Web Workers are not available in this environment.',
      elapsedMs: 0,
      runtimeUnavailable: true,
    });
  }

  return new Promise((resolve) => {
    const worker = ensurePythonWorker();
    const reqId = `py-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let settled = false;
    let execStarted = false;

    let activeTimer: number | null = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resetPythonWorker();
      resolve({
        ok: false,
        stdout: '',
        stderr:
          'The Python engine took too long to download on first load (over 45s). Please check your internet connection and click Run Code again — once downloaded, Python runs instantly offline!',
        elapsedMs: bootTimeoutMs,
        timedOut: true,
        runtimeUnavailable: true,
      });
    }, bootTimeoutMs);

    const clearActiveTimer = () => {
      if (activeTimer !== null) {
        window.clearTimeout(activeTimer);
        activeTimer = null;
      }
    };

    const onMessage = (
      e: MessageEvent<{ type?: string; id?: string } & Partial<ExecutionResult>>,
    ) => {
      if (settled || e.data?.id !== reqId) return;

      if (e.data.type === 'exec_started') {
        execStarted = true;
        clearActiveTimer();
        // Now start the strict infinite-loop execution guard
        activeTimer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          resetPythonWorker();
          resolve({
            ok: false,
            stdout: '',
            stderr: `Your Python code ran longer than ${timeoutMs / 1000} seconds and was paused safely (check for an infinite while-loop!).`,
            elapsedMs: timeoutMs,
            timedOut: true,
          });
        }, timeoutMs);
        return;
      }

      if (e.data.type === 'exec_result' || typeof e.data.ok === 'boolean') {
        settled = true;
        clearActiveTimer();
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        resolve({
          ok: Boolean(e.data.ok),
          stdout: String(e.data.stdout ?? ''),
          stderr: String(e.data.stderr ?? ''),
          elapsedMs: Number(e.data.elapsedMs ?? 0),
          runtimeUnavailable: Boolean(e.data.runtimeUnavailable),
        });
      }
    };

    const onError = (err: ErrorEvent) => {
      if (settled) return;
      settled = true;
      clearActiveTimer();
      resetPythonWorker();
      resolve({
        ok: false,
        stdout: '',
        stderr: execStarted
          ? `Python runtime interrupted: ${err.message || 'Worker crashed'}`
          : `Could not initialize Python engine: ${err.message || 'Network or Worker error'}`,
        elapsedMs: 0,
        runtimeUnavailable: true,
      });
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({ type: 'run', id: reqId, code, stdin });
  });
}

/**
 * Executes C, C++, or Java exclusively via the optional isolated Docker sandbox service.
 * Never fakes compiler output when the local sandbox service is offline/not started.
 */
export async function runCompiledSandbox(
  language: Exclude<CompilerLanguage, 'python'>,
  code: string,
  stdin: string,
  sandboxUrl = DEFAULT_SANDBOX_URL,
): Promise<ExecutionResult> {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const res = await fetch(sandboxUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, stdin }),
      signal: controller.signal,
    });
    window.clearTimeout(timer);

    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        stdout: '',
        stderr: txt || `Sandbox returned HTTP ${res.status}`,
        elapsedMs: Math.round(performance.now() - started),
      };
    }

    const data = (await res.json()) as ExecutionResult;
    return data;
  } catch {
    return {
      ok: false,
      stdout: '',
      stderr: `Isolated ${language.toUpperCase()} Docker sandbox is not reachable at ${sandboxUrl}. Start the optional hardened runner in server/sandbox-runner (requires Docker), or select Python 3 for zero-config in-browser Pyodide execution.`,
      elapsedMs: Math.round(performance.now() - started),
      runtimeUnavailable: true,
    };
  }
}

export async function executeCode(
  language: CompilerLanguage,
  code: string,
  stdin: string,
): Promise<ExecutionResult> {
  if (language === 'python') {
    return runPythonInWorker(code, stdin, 6000, 45000);
  }
  return runCompiledSandbox(language, code, stdin);
}

export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Evaluates student code against visible and hidden test cases.
 * Hidden test case inputs and expected outputs are NEVER exposed in the returned grade objects.
 */
export async function gradeCodingSubmission(
  language: CompilerLanguage,
  code: string,
  testCases: readonly CodingTestCase[],
  executor: (lang: CompilerLanguage, src: string, stdin: string) => Promise<ExecutionResult> = executeCode,
): Promise<CodingGradeSummary> {
  const results: TestCaseGrade[] = [];
  let earnedPoints = 0;
  let maxPoints = 0;
  let passedCount = 0;

  for (const tc of testCases) {
    maxPoints += tc.points;
    const exec = await executor(language, code, tc.input);

    if (exec.runtimeUnavailable) {
      return {
        earnedPoints: 0,
        maxPoints: testCases.reduce((s, t) => s + t.points, 0),
        passedCount: 0,
        totalCount: testCases.length,
        results: [],
        runtimeUnavailable: true,
        errorMessage: exec.stderr,
      };
    }

    const actualNorm = normalizeOutput(exec.stdout);
    const expectedNorm = normalizeOutput(tc.expectedOutput);
    const passed = exec.ok && actualNorm === expectedNorm;

    if (passed) {
      passedCount += 1;
      earnedPoints += tc.points;
    }

    results.push({
      testCaseId: tc.id,
      isHidden: tc.isHidden,
      description: tc.isHidden ? 'Hidden Test Case' : tc.description,
      passed,
      pointsEarned: passed ? tc.points : 0,
      maxPoints: tc.points,
      elapsedMs: exec.elapsedMs,
      ...(tc.isHidden
        ? {}
        : {
            actualOutput: actualNorm,
            expectedOutput: expectedNorm,
          }),
      stderr: exec.stderr || undefined,
    });
  }

  return {
    earnedPoints,
    maxPoints,
    passedCount,
    totalCount: testCases.length,
    results,
  };
}
