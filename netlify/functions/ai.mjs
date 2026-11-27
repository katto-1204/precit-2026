/**
 * Netlify Functions v2 handler for PrepCIT AI endpoints (/api/ai/*).
 * Keeps GEMINI_API_KEY strictly server-side in Netlify Site Environment Variables.
 * When GEMINI_API_KEY is unset, returns HTTP 503 (NO_API_KEY) so PrepCIT
 * seamlessly falls back to its zero-key local 2026 syllabus tutor.
 */

export const config = {
  path: '/api/ai/*',
};

const SYSTEM_PROMPT = `You are PrepCIT AI Tutor, a rigorous CS/IT instructor preparing a BSIT student for the revised 2026 TOPCIT exam (M1 Software Dev, M2 Data Mgmt, M3 Systems Architecture & InfoSec, M4 IT Business).
Rules:
- Never claim official TOPCIT affiliation or identical grading to official TOPCIT.
- Always label any estimated descriptive/rubric feedback clearly as an AI-assisted estimate.
- Structure explanations with: Definition, Step-by-step reasoning, Concrete example/code, and Suggested 2026 practice topic.`;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];

async function callGeminiSingleModel(apiKey, model, prompt, jsonMode = false, retries = 2) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
    return { text, resolvedModel: model };
  }

  throw new Error('Gemini request failed after retries.');
}

async function callGemini(apiKey, preferredModel, prompt, jsonMode = false) {
  const candidates = Array.from(new Set([preferredModel, ...FALLBACK_MODELS].filter(Boolean)));
  let lastError = null;
  for (const candidate of candidates) {
    try {
      return await callGeminiSingleModel(apiKey, candidate, prompt, jsonMode);
    } catch (err) {
      lastError = err;
      // Only try next model on 404 (model deprecated / unavailable for account)
      if (err && err.httpStatus === 404) {
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('No available Gemini Flash model responded.');
}

export default async function handler(req) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const enabled = process.env.GEMINI_AI_ENABLED !== 'false';
  const url = new URL(req.url);
  const subpath = url.pathname.replace(/^\/api\/ai\/?/, '');

  if (req.method === 'GET' && subpath === 'status') {
    return jsonResponse({
      configured: Boolean(apiKey) && enabled,
      model,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  if (!enabled || !apiKey) {
    return jsonResponse(
      {
        ok: false,
        code: 'NO_API_KEY',
        error: 'GEMINI_API_KEY is not configured in Netlify Environment Variables. Using local syllabus fallback.',
      },
      503,
    );
  }

  try {
    const body = await req.json();

    if (subpath === 'tutor') {
      const { prompt } = body;
      if (typeof prompt !== 'string' || prompt.trim().length < 2) {
        return jsonResponse({ ok: false, error: 'Prompt is required.' }, 400);
      }
      const { text: answer, resolvedModel } = await callGemini(apiKey, model, prompt, false);
      return jsonResponse({
        ok: true,
        cached: false,
        model: resolvedModel,
        answer,
        disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
      });
    }

    if (subpath === 'grade-descriptive') {
      const { questionPrompt, rubric, studentAnswer, maxPoints = 30 } = body;
      if (!studentAnswer || String(studentAnswer).trim().length === 0) {
        return jsonResponse({
          ok: true,
          estimatedPoints: 0,
          maxPoints,
          correctConcepts: [],
          missingConcepts: ['Blank submission receives 0 points.'],
          feedback: 'No answer provided.',
          disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
        });
      }
      const gradingPrompt = `Grade this student's descriptive response strictly using the rubric (max ${maxPoints} points).
Return JSON with keys: estimatedPoints (integer 0..${maxPoints}), correctConcepts (string[]), missingConcepts (string[]), feedback (string), improvedAnswer (string).
Question: ${questionPrompt}
Rubric: ${JSON.stringify(rubric || [])}
Student Answer: ${studentAnswer}`;
      const { text: rawText, resolvedModel } = await callGemini(apiKey, model, gradingPrompt, true);
      const parsed = JSON.parse(rawText);
      return jsonResponse({
        ok: true,
        ...parsed,
        estimatedPoints: Math.max(0, Math.min(maxPoints, Math.round(Number(parsed.estimatedPoints || 0)))),
        maxPoints,
        model: resolvedModel,
        disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
      });
    }

    if (subpath === 'generate-question') {
      const { domain = 'M3', topicId = 'M3-SEC-TECH', difficulty = 'medium' } = body;
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
      const { text: rawText } = await callGemini(apiKey, model, genPrompt, true);
      const draft = JSON.parse(rawText);
      return jsonResponse({
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
        model,
        disclaimer: 'AI-Generated Draft — Pending Validation (Not an Official TOPCIT Question)',
      });
    }

    return jsonResponse({ ok: false, error: 'Unknown AI endpoint.' }, 404);
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        code: 'UPSTREAM_ERROR',
        error: err instanceof Error ? err.message : 'Gemini upstream error.',
      },
      502,
    );
  }
}
