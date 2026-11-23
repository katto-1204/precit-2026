import { z } from 'zod';
import { SEED_LESSONS } from '@/data/lessons_seed';
import { SYLLABUS_2026_TOPICS } from '@/domain/syllabus2026';

export const AiTutorResponseSchema = z.object({
  ok: z.boolean(),
  answer: z.string().optional(),
  model: z.string().optional(),
  cached: z.boolean().optional(),
  disclaimer: z.string().optional(),
  code: z.string().optional(),
  error: z.string().optional(),
  budget: z
    .object({
      remaining: z.number(),
      used: z.number(),
      limit: z.number(),
    })
    .optional(),
});

export type AiTutorResponse = z.infer<typeof AiTutorResponseSchema>;

export interface TutorReply {
  source: 'gemini_backend' | 'local_offline_fallback';
  modelLabel: string;
  answer: string;
  disclaimer: string;
  cached?: boolean;
  budget?: { remaining: number; used: number; limit: number };
}

/**
 * Deterministic local syllabus tutor fallback when GEMINI_API_KEY or backend is unavailable.
 * Grounds answers strictly in PrepCIT's local M1-M4 curriculum & glossary (never hallucinates).
 */
export function buildOfflineTutorFallback(prompt: string, reasonNote?: string): TutorReply {
  const q = prompt.trim().toLowerCase();
  const tokens = q.split(/\W+/).filter((t) => t.length >= 3);

  const scoredLessons = SEED_LESSONS.map((lesson) => {
    const haystack = `${lesson.title} ${lesson.summary} ${lesson.contentMarkdown} ${lesson.glossary
      .map((g) => `${g.term} ${g.definition}`)
      .join(' ')}`.toLowerCase();
    const hits = tokens.reduce((acc, tok) => acc + (haystack.includes(tok) ? 1 : 0), 0);
    return { lesson, hits };
  }).sort((a, b) => b.hits - a.hits);

  const topLesson = scoredLessons[0]?.hits > 0 ? scoredLessons[0].lesson : null;
  const matchingTopics = SYLLABUS_2026_TOPICS.filter((t) =>
    tokens.some(
      (tok) =>
        t.title.toLowerCase().includes(tok) ||
        t.summary.toLowerCase().includes(tok) ||
        t.keySkills.some((k) => k.toLowerCase().includes(tok)),
    ),
  ).slice(0, 2);

  const lines: string[] = [];
  if (reasonNote) {
    lines.push(`[Offline Local Tutor Active] ${reasonNote}`);
    lines.push('');
  }

  if (topLesson) {
    lines.push(`**Matched 2026 Syllabus Lesson (${topLesson.domain}):** ${topLesson.title}`);
    lines.push(topLesson.summary);
    lines.push('');
    lines.push('**Key Concepts & Definitions:**');
    for (const g of topLesson.glossary.slice(0, 4)) {
      lines.push(`- **${g.term}**: ${g.definition}`);
    }
    if (topLesson.workedExample) {
      lines.push('');
      lines.push(topLesson.workedExample);
    }
  } else {
    lines.push(
      'No direct keyword match found in the local M1–M4 quick index. Try specific TOPCIT terms such as **CIA Triad**, **SQL Injection**, **LEFT JOIN**, **BCNF**, **CIDR**, **Deadlock**, **SOLID**, **UML Composition**, **EVM CPI/SPI**, or **GPL vs MIT**.',
    );
  }

  if (matchingTopics.length > 0) {
    lines.push('');
    lines.push(
      `**Recommended 2026 Practice Topics:** ${matchingTopics
        .map((t) => `${t.code} ${t.title} (${t.domain})`)
        .join(' · ')}`,
    );
  }

  return {
    source: 'local_offline_fallback',
    modelLabel: 'Local Curriculum Retrieval (Zero API Key)',
    answer: lines.join('\n'),
    disclaimer:
      'Local deterministic curriculum lookup — start server/api with GEMINI_API_KEY for live Gemini Flash tutoring.',
  };
}

export async function askPrepCitTutor(
  prompt: string,
  mode: 'tutor' | 'descriptive_feedback' | 'weakness_plan' | 'question_draft' = 'tutor',
  endpoint = 'http://127.0.0.1:8788/api/ai/tutor',
  fetcher: typeof fetch = fetch,
): Promise<TutorReply> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const rawJson = (await res.json()) as unknown;
    const parsed = AiTutorResponseSchema.safeParse(rawJson);

    if (!parsed.success) {
      return buildOfflineTutorFallback(
        prompt,
        'Backend returned an unexpected schema; fell back safely to local syllabus retrieval.',
      );
    }

    if (!res.ok || !parsed.data.ok || !parsed.data.answer) {
      return buildOfflineTutorFallback(
        prompt,
        parsed.data.error ?? `Gemini backend returned HTTP ${res.status}.`,
      );
    }

    return {
      source: 'gemini_backend',
      modelLabel: parsed.data.model ?? 'Gemini Flash',
      answer: parsed.data.answer,
      disclaimer:
        parsed.data.disclaimer ?? 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
      cached: parsed.data.cached,
      budget: parsed.data.budget,
    };
  } catch {
    return buildOfflineTutorFallback(
      prompt,
      'Gemini backend proxy (http://127.0.0.1:8788) is not running or offline.',
    );
  }
}
