import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

/**
 * PrepCIT V2.0 Backend Proxy for Google Gemini Developer API (Free Tier Flash-First).
 * SECURITY: GEMINI_API_KEY stays strictly on the server — NEVER exposed to frontend bundles.
 *
 * Endpoints:
 *   GET  /api/ai/status
 *   POST /api/ai/tutor
 *   POST /api/ai/grade-descriptive
 *   POST /api/ai/generate-question
 */

// Load workspace .env / .env.local automatically for local convenience without overriding shell env
for (const envFile of ['.env', '.env.local']) {
  const fullPath = resolve(process.cwd(), envFile);
  if (existsSync(fullPath)) {
    for (const line of readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k && !(k in process.env)) {
        process.env[k] = v;
      }
    }
  }
}

const PORT = Number(process.env.API_PORT || 8788);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];
const GEMINI_DAILY_LIMIT = Number(process.env.GEMINI_DAILY_REQUEST_LIMIT || 50);
const GEMINI_ENABLED = process.env.GEMINI_AI_ENABLED !== 'false';

const cache = new Map();
let usageDay = new Date().toISOString().slice(0, 10);
let dailyRequests = 0;

function checkBudget() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== usageDay) {
    usageDay = today;
    dailyRequests = 0;
  }
  return {
    remaining: Math.max(0, GEMINI_DAILY_LIMIT - dailyRequests),
    used: dailyRequests,
    limit: GEMINI_DAILY_LIMIT,
  };
}

async function callSingleGeminiModel(model, prompt, systemInstruction, jsonMode = false, retries = 2) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: jsonMode ? 0.2 : 0.3,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });

    if (res.status === 429 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text();
      const err = new Error(`Gemini API HTTP ${res.status}: ${errBody.slice(0, 220)}`);
      err.httpStatus = res.status;
      throw err;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned empty response.');
    return text;
  }
  throw new Error('Gemini request failed after retries.');
}

async function callGeminiWithBackoff(prompt, systemInstruction, jsonMode = false, retries = 2) {
  const candidates = Array.from(new Set([GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean)));
  let lastError = null;
  for (const candidate of candidates) {
    try {
      return await callSingleGeminiModel(candidate, prompt, systemInstruction, jsonMode, retries);
    } catch (err) {
      lastError = err;
      if (err && err.httpStatus === 404) {
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('No available Gemini Flash model responded.');
}

const SYSTEM_PROMPT = `You are PrepCIT AI Tutor, a rigorous CS/IT instructor preparing a BSIT student for the revised 2026 TOPCIT exam (M1 Software Dev, M2 Data Mgmt, M3 Systems Architecture & InfoSec, M4 IT Business).
Rules:
- Never claim official TOPCIT affiliation or identical grading to official TOPCIT.
- Always label any estimated descriptive/rubric feedback clearly as an AI-assisted estimate.
- Structure explanations with: Definition, Step-by-step reasoning, Concrete example/code, and Suggested 2026 practice topic.`;

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 200_000) throw new Error('Payload too large');
  }
  return JSON.parse(raw || '{}');
}

function ensureConfiguredAndWithinBudget(res) {
  if (!GEMINI_ENABLED || !GEMINI_API_KEY) {
    sendJson(res, 503, {
      ok: false,
      code: 'NO_API_KEY',
      error: 'GEMINI_API_KEY is not configured on the backend server. Using offline fallback.',
    });
    return false;
  }
  const budget = checkBudget();
  if (budget.remaining <= 0) {
    sendJson(res, 429, {
      ok: false,
      code: 'QUOTA_EXCEEDED',
      error: `Daily Gemini request budget (${budget.limit}) reached. Core offline study remains available.`,
    });
    return false;
  }
  return true;
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/ai/status') {
    sendJson(res, 200, {
      configured: Boolean(GEMINI_API_KEY) && GEMINI_ENABLED,
      model: GEMINI_MODEL,
      budget: checkBudget(),
    });
    return;
  }

  try {
    if (req.method === 'POST' && req.url === '/api/ai/tutor') {
      const { prompt, mode = 'tutor' } = await readBody(req);
      if (typeof prompt !== 'string' || prompt.trim().length < 2) {
        sendJson(res, 400, { ok: false, error: 'Prompt is required.' });
        return;
      }
      if (!ensureConfiguredAndWithinBudget(res)) return;

      const cacheKey = `${mode}:${prompt.trim().toLowerCase()}`;
      if (cache.has(cacheKey)) {
        sendJson(res, 200, {
          ok: true,
          cached: true,
          model: GEMINI_MODEL,
          answer: cache.get(cacheKey),
          disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
          budget: checkBudget(),
        });
        return;
      }

      const answer = await callGeminiWithBackoff(prompt, SYSTEM_PROMPT, false);
      dailyRequests += 1;
      cache.set(cacheKey, answer);
      sendJson(res, 200, {
        ok: true,
        cached: false,
        model: GEMINI_MODEL,
        answer,
        disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
        budget: checkBudget(),
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/ai/grade-descriptive') {
      const { questionPrompt, rubric, studentAnswer, maxPoints = 30 } = await readBody(req);
      if (!studentAnswer || String(studentAnswer).trim().length === 0) {
        sendJson(res, 200, {
          ok: true,
          estimatedPoints: 0,
          maxPoints,
          correctConcepts: [],
          missingConcepts: ['Blank submission receives 0 points.'],
          feedback: 'No answer provided.',
          disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
        });
        return;
      }
      if (!ensureConfiguredAndWithinBudget(res)) return;

      const gradingPrompt = `Grade this student's descriptive response strictly using the rubric (max ${maxPoints} points).
Return JSON with keys: estimatedPoints (integer 0..${maxPoints}), correctConcepts (string[]), missingConcepts (string[]), feedback (string), improvedAnswer (string).
Question: ${questionPrompt}
Rubric: ${JSON.stringify(rubric || [])}
Student Answer: ${studentAnswer}`;

      const rawText = await callGeminiWithBackoff(gradingPrompt, SYSTEM_PROMPT, true);
      dailyRequests += 1;
      const parsed = JSON.parse(rawText);
      sendJson(res, 200, {
        ok: true,
        ...parsed,
        estimatedPoints: Math.max(0, Math.min(maxPoints, Math.round(Number(parsed.estimatedPoints || 0)))),
        maxPoints,
        model: GEMINI_MODEL,
        disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
        budget: checkBudget(),
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/ai/generate-question') {
      const { domain = 'M3', topicId = 'M3-SEC-TECH', difficulty = 'medium' } = await readBody(req);
      if (!ensureConfiguredAndWithinBudget(res)) return;

      const genPrompt = `Generate 1 original TOPCIT 2026 multiple-choice question (5 points) for domain=${domain}, topicId=${topicId}, difficulty=${difficulty}.
Return ONLY JSON matching:
{
  "title": string,
  "prompt": string,
  "options": [{"id":"A","text":string},{"id":"B","text":string},{"id":"C","text":string},{"id":"D","text":string}],
  "correctOptionId": "A"|"B"|"C"|"D",
  "explanation": string,
  "estimatedSeconds": number
}`;
      const rawText = await callGeminiWithBackoff(genPrompt, SYSTEM_PROMPT, true);
      dailyRequests += 1;
      const draft = JSON.parse(rawText);
      sendJson(res, 200, {
        ok: true,
        draft: {
          ...draft,
          id: `AI-DRAFT-${Date.now()}`,
          domain,
          topicId,
          difficulty,
          questionType: 'mcq',
          pointValue: 5,
          references: [{ label: `AI Draft for ${domain} (${topicId})` }],
          sourceClassification: 'ai_draft_pending',
          contentVersion: '2026.1.0-draft',
          reviewStatus: 'draft',
        },
        model: GEMINI_MODEL,
        disclaimer: 'AI-Generated Draft — Pending Validation (Not an Official TOPCIT Question)',
        budget: checkBudget(),
      });
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch (err) {
    sendJson(res, 502, {
      ok: false,
      code: 'UPSTREAM_ERROR',
      error: err instanceof Error ? err.message : 'Gemini upstream error.',
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(
    `[PrepCIT AI Backend] Listening on http://127.0.0.1:${PORT} (model=${GEMINI_MODEL}, configured=${Boolean(
      GEMINI_API_KEY,
    )})`,
  );
});
