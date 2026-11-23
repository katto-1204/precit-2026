/// <reference lib="webworker" />

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
  };
}

let pyodideReady: Promise<PyodideInterface> | null = null;

async function getPyodide(): Promise<PyodideInterface> {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      const cdnUrl = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.mjs';
      const mod = (await import(/* @vite-ignore */ cdnUrl)) as {
        loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;
      };
      return mod.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/',
      });
    })();
  }
  return pyodideReady;
}

self.onmessage = async (event: MessageEvent<{ id: string; code: string; stdin: string }>) => {
  const { id, code, stdin } = event.data;
  const started = performance.now();

  try {
    const pyodide = await getPyodide();
    pyodide.globals.set('__user_code__', code);
    pyodide.globals.set('__user_stdin__', stdin);

    const runner = `
import io, sys, traceback

_stdout = io.StringIO()
_stderr = io.StringIO()
_old_in, _old_out, _old_err = sys.stdin, sys.stdout, sys.stderr
sys.stdin = io.StringIO(__user_stdin__)
sys.stdout = _stdout
sys.stderr = _stderr
_ok = True
try:
    exec(compile(__user_code__, "<student_solution.py>", "exec"), {"__name__": "__main__"})
except Exception:
    _ok = False
    traceback.print_exc(file=_stderr)
finally:
    sys.stdin, sys.stdout, sys.stderr = _old_in, _old_out, _old_err

(__ok := _ok, _stdout.getvalue(), _stderr.getvalue())
`;
    const resultProxy = (await pyodide.runPythonAsync(runner)) as {
      toJs?: () => [boolean, string, string];
    };
    const [ok, stdout, stderr] = resultProxy?.toJs
      ? resultProxy.toJs()
      : [false, '', 'Unexpected Pyodide return format.'];

    self.postMessage({
      id,
      ok: Boolean(ok),
      stdout: String(stdout ?? ''),
      stderr: String(stderr ?? ''),
      elapsedMs: Math.round(performance.now() - started),
    });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      stdout: '',
      stderr:
        err instanceof Error
          ? `Python Web Worker runtime unavailable (${err.message}). If offline, ensure Pyodide was cached while online.`
          : 'Unknown Python runtime error.',
      elapsedMs: Math.round(performance.now() - started),
    });
  }
};
