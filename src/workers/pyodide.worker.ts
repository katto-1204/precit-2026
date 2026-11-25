/// <reference lib="webworker" />

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
  };
}

let pyodideReady: Promise<PyodideInterface> | null = null;
let pyodideLoaded = false;

async function getPyodide(): Promise<PyodideInterface> {
  if (!pyodideReady) {
    self.postMessage({ type: 'runtime_status', status: 'loading' });
    pyodideReady = (async () => {
      try {
        const cdnUrl = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.mjs';
        const mod = (await import(/* @vite-ignore */ cdnUrl)) as {
          loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;
        };
        const instance = await mod.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/',
        });
        pyodideLoaded = true;
        self.postMessage({ type: 'runtime_status', status: 'ready' });
        return instance;
      } catch (err) {
        pyodideReady = null;
        pyodideLoaded = false;
        self.postMessage({
          type: 'runtime_status',
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to load Pyodide',
        });
        throw err;
      }
    })();
  }
  return pyodideReady;
}

type IncomingMsg =
  | { type: 'warmup' }
  | { type?: 'run'; id: string; code: string; stdin: string };

self.onmessage = async (event: MessageEvent<IncomingMsg>) => {
  if (event.data?.type === 'warmup') {
    if (pyodideLoaded) {
      self.postMessage({ type: 'runtime_status', status: 'ready' });
      return;
    }
    try {
      await getPyodide();
    } catch {
      // status message already posted
    }
    return;
  }

  const { id, code, stdin } = event.data;

  try {
    const pyodide = await getPyodide();

    // Signal main thread ONLY NOW to start the code-execution infinite-loop timer
    const started = performance.now();
    self.postMessage({ type: 'exec_started', id });

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
      type: 'exec_result',
      id,
      ok: Boolean(ok),
      stdout: String(stdout ?? ''),
      stderr: String(stderr ?? ''),
      elapsedMs: Math.round(performance.now() - started),
    });
  } catch (err) {
    self.postMessage({
      type: 'exec_result',
      id,
      ok: false,
      stdout: '',
      stderr:
        err instanceof Error
          ? `Could not load the in-browser Python engine (${err.message}). Make sure you are connected to the internet for the first-time Pyodide download, then click Run again.`
          : 'Could not start the Python runtime.',
      elapsedMs: 0,
      runtimeUnavailable: true,
    });
  }
};
