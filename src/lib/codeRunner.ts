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

const DEFAULT_SANDBOX_URL = 'http://localhost:8787/api/execute';

let sharedPythonWorker: Worker | null = null;

function resetPythonWorker() {
  if (sharedPythonWorker) {
    sharedPythonWorker.terminate();
    sharedPythonWorker = null;
  }
}

/**
 * Executes Python 3 inside an isolated Pyodide Web Worker with hard timeout termination
 * protecting against infinite loops and runaway CPU.
 */
export function runPythonInWorker(
  code: string,
  stdin: string,
  timeoutMs = 5000,
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
    if (!sharedPythonWorker) {
      sharedPythonWorker = new Worker(
        new URL('../workers/pyodide.worker.ts', import.meta.url),
        { type: 'module' },
      );
    }

    const worker = sharedPythonWorker;
    const reqId = `py-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resetPythonWorker();
      resolve({
        ok: false,
        stdout: '',
        stderr: `Execution terminated: exceeded ${timeoutMs}ms time limit (possible infinite loop).`,
        elapsedMs: timeoutMs,
        timedOut: true,
      });
    }, timeoutMs);

    const onMessage = (e: MessageEvent<{ id: string } & ExecutionResult>) => {
      if (e.data?.id !== reqId || settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      resolve({
        ok: e.data.ok,
        stdout: e.data.stdout,
        stderr: e.data.stderr,
        elapsedMs: e.data.elapsedMs,
      });
    };

    const onError = (err: ErrorEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resetPythonWorker();
      resolve({
        ok: false,
        stdout: '',
        stderr: `Python worker error: ${err.message || 'Worker crashed'}`,
        elapsedMs: 0,
        runtimeUnavailable: true,
      });
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({ id: reqId, code, stdin });
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
    return runPythonInWorker(code, stdin, 6000);
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
