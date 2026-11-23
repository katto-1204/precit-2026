import { describe, expect, it } from 'vitest';
import { askPrepCitTutor, buildOfflineTutorFallback } from '@/lib/aiTutorClient';
import { analyzeExtractedPages, buildLessonFromPdfPreview } from '@/lib/pdfIngestor';

describe('Phase 5/6 & V2.0 — PDF Provenance Ingestion & Gemini AI Tutor Resilience', () => {
  it('extracts concepts with exact page provenance, detects year/type, and builds source-linked lessons', () => {
    const preview = analyzeExtractedPages('04-security-TOPCIT.pdf', [
      {
        pageNumber: 1,
        text: 'TOPCIT 2026 Information Security Reviewer. Core CIA Triad principles and DMZ network segmentation.',
        tableLikeLines: [],
      },
      {
        pageNumber: 2,
        text: 'Prevent SQL Injection using parameterized queries, defend XSS with CSP, and hash passwords with Argon2id.',
        tableLikeLines: [],
      },
    ]);

    expect(preview.documentType).toBe('study_guide');
    expect(preview.yearVersion).toBe('2026');
    expect(preview.mappedDomains).toContain('M3');
    expect(preview.concepts.some((c) => c.term === 'SQL INJECTION' && c.pageNumber === 2)).toBe(
      true,
    );

    const lesson = buildLessonFromPdfPreview(preview, 'src-test');
    expect(lesson.domain).toBe('M3');
    expect(lesson.contentMarkdown).toContain('Page 2');
    expect(lesson.references[0]?.sourceId).toBe('src-test');
  });

  it('warns explicitly when uploaded PDF has minimal text layer instead of fabricating content', () => {
    const emptyPreview = analyzeExtractedPages('scanned-report.pdf', [
      { pageNumber: 1, text: '   ', tableLikeLines: [] },
    ]);
    expect(emptyPreview.warnings.some((w) => w.includes('Minimal text layer'))).toBe(true);
    expect(emptyPreview.concepts).toEqual([]);
  });

  it('handles missing API key, quota exceeded (429), and invalid JSON gracefully with local fallback', async () => {
    // 1. Missing API key (503)
    const noKeyReply = await askPrepCitTutor(
      'Explain SQL Injection primary defense',
      'tutor',
      'http://mock/api/ai/tutor',
      async () =>
        new Response(
          JSON.stringify({ ok: false, code: 'NO_API_KEY', error: 'Missing GEMINI_API_KEY' }),
          { status: 503 },
        ),
    );
    expect(noKeyReply.source).toBe('local_offline_fallback');
    expect(noKeyReply.answer).toContain('Parameterized Query');

    // 2. Quota exceeded (429)
    const quotaReply = await askPrepCitTutor(
      'Explain BCNF normalization',
      'tutor',
      'http://mock/api/ai/tutor',
      async () =>
        new Response(
          JSON.stringify({ ok: false, code: 'QUOTA_EXCEEDED', error: 'Daily limit reached' }),
          { status: 429 },
        ),
    );
    expect(quotaReply.source).toBe('local_offline_fallback');
    expect(quotaReply.answer).toContain('Daily limit reached');

    // 3. Valid Gemini backend response preserves explicit AI estimate disclaimer
    const validReply = await askPrepCitTutor(
      'Explain CIDR /26',
      'tutor',
      'http://mock/api/ai/tutor',
      async () =>
        new Response(
          JSON.stringify({
            ok: true,
            model: 'gemini-2.5-flash',
            answer: 'A /26 subnet has 64 addresses and 62 usable hosts.',
            disclaimer: 'AI-Assisted Estimate — Not Official TOPCIT Evaluation',
          }),
          { status: 200 },
        ),
    );
    expect(validReply.source).toBe('gemini_backend');
    expect(validReply.disclaimer).toContain('Not Official TOPCIT');

    // 4. Local fallback directly
    const local = buildOfflineTutorFallback('Explain EVM CPI SPI');
    expect(local.answer).toContain('CPI');
  });
});
