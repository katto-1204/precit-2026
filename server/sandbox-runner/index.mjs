import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * PrepCIT Optional Isolated Docker Sandbox Runner for C, C++, Java, and Python.
 * SECURITY: Never executes submitted code directly on the host OS.
 * Every invocation runs inside an ephemeral container with:
 * - --network=none (zero network access)
 * - --memory=128m --memory-swap=128m
 * - --cpus=0.5
 * - --pids-limit=64 (blocks fork bombs)
 * - --read-only rootfs with small /tmp tmpfs
 * - Hard wall-clock timeout (5 seconds)
 */

const PORT = Number(process.env.SANDBOX_PORT || 8787);
const TIMEOUT_MS = 5000;

const DOCKER_RECIPES = {
  c: {
    image: 'gcc:13-bookworm',
    fileName: 'main.c',
    command: 'gcc -O2 -Wall /work/main.c -o /tmp/a.out && /tmp/a.out < /work/stdin.txt',
  },
  cpp: {
    image: 'gcc:13-bookworm',
    fileName: 'main.cpp',
    command: 'g++ -O2 -std=c++20 -Wall /work/main.cpp -o /tmp/a.out && /tmp/a.out < /work/stdin.txt',
  },
  java: {
    image: 'eclipse-temurin:17-jdk-alpine',
    fileName: 'Main.java',
    command: 'javac -d /tmp /work/Main.java && java -Xmx96m -cp /tmp Main < /work/stdin.txt',
  },
  python: {
    image: 'python:3.12-alpine',
    fileName: 'main.py',
    command: 'python3 -I /work/main.py < /work/stdin.txt',
  },
};

function runDocker(workDir, recipe) {
  return new Promise((resolve) => {
    const started = Date.now();
    const args = [
      'run',
      '--rm',
      '--network=none',
      '--memory=128m',
      '--memory-swap=128m',
      '--cpus=0.5',
      '--pids-limit=64',
      '--read-only',
      '--tmpfs',
      '/tmp:rw,exec,nosuid,size=32m',
      '-v',
      `${workDir}:/work:ro`,
      recipe.image,
      'sh',
      '-c',
      recipe.command,
    ];

    execFile('docker', args, { timeout: TIMEOUT_MS, maxBuffer: 256 * 1024 }, (err, stdout, stderr) => {
      const elapsedMs = Date.now() - started;
      if (err) {
        resolve({
          ok: false,
          stdout: String(stdout || ''),
          stderr: err.killed
            ? `Execution terminated after ${TIMEOUT_MS}ms timeout.`
            : String(stderr || err.message),
          elapsedMs,
          timedOut: Boolean(err.killed),
        });
        return;
      }
      resolve({
        ok: true,
        stdout: String(stdout || ''),
        stderr: String(stderr || ''),
        elapsedMs,
      });
    });
  });
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/execute') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, stderr: 'Not found' }));
    return;
  }

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, stderr: 'Payload too large' }));
      return;
    }
  }

  try {
    const { language, code, stdin = '' } = JSON.parse(raw);
    const recipe = DOCKER_RECIPES[language];
    if (!recipe || typeof code !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, stderr: 'Unsupported language or invalid code payload' }));
      return;
    }

    const workDir = await mkdtemp(path.join(tmpdir(), 'prepcit-sandbox-'));
    try {
      await writeFile(path.join(workDir, recipe.fileName), code, 'utf8');
      await writeFile(path.join(workDir, 'stdin.txt'), String(stdin), 'utf8');
      const result = await runDocker(workDir, recipe);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, stderr: err instanceof Error ? err.message : 'Bad request' }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[PrepCIT Sandbox] Isolated Docker code runner listening on http://127.0.0.1:${PORT}/api/execute`);
});
