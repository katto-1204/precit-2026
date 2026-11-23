import type { DomainId } from '@/domain/blueprint2026';
import type { Lesson, StudySource } from '@/domain/schemas';

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  tableLikeLines: string[];
}

export interface ExtractedConcept {
  term: string;
  snippet: string;
  pageNumber: number;
  mappedDomain: DomainId;
  mappedTopicId: string;
}

export interface PdfExtractionPreview {
  fileName: string;
  pageCount: number;
  documentType: StudySource['documentType'];
  yearVersion: string;
  pages: ExtractedPdfPage[];
  concepts: ExtractedConcept[];
  mappedDomains: DomainId[];
  warnings: string[];
}

const DOMAIN_SIGNATURES: {
  domain: DomainId;
  topicId: string;
  keywords: string[];
}[] = [
  { domain: 'M1', topicId: 'M1-SE', keywords: ['scrum', 'agile', 'sdlc', 'waterfall', 'requirements', 'verification'] },
  { domain: 'M1', topicId: 'M1-ALG', keywords: ['algorithm', 'big-o', 'dijkstra', 'bfs', 'dfs', 'merge sort', 'hash table', 'dynamic programming'] },
  { domain: 'M1', topicId: 'M1-UML', keywords: ['uml', 'class diagram', 'activity diagram', 'sequence diagram', 'use case', 'solid', 'strategy pattern'] },
  { domain: 'M1', topicId: 'M1-TEST', keywords: ['boundary value', 'cyclomatic', 'unit test', 'refactoring', 'black-box'] },
  { domain: 'M2', topicId: 'M2-MODEL', keywords: ['normalization', '3nf', 'bcnf', 'erd', 'entity relationship', 'cardinality', 'foreign key'] },
  { domain: 'M2', topicId: 'M2-SQL', keywords: ['sql', 'left join', 'group by', 'having', 'acid', 'isolation', 'transaction', 'window function'] },
  { domain: 'M2', topicId: 'M2-OPS', keywords: ['b-tree', 'index', 'wal', 'write-ahead', 'sargable', 'query plan'] },
  { domain: 'M3', topicId: 'M3-OS', keywords: ['deadlock', 'paging', 'thrashing', 'scheduling', 'virtual memory', 'semaphore'] },
  { domain: 'M3', topicId: 'M3-NET', keywords: ['tcp', 'udp', 'cidr', 'subnet', 'osi', 'dns', 'http', 'routing'] },
  { domain: 'M3', topicId: 'M3-ARCH', keywords: ['cap theorem', 'load balancer', 'microservice', 'cloud', 'iaas', 'paas', 'failover'] },
  { domain: 'M3', topicId: 'M3-SEC-FUND', keywords: ['cia triad', 'authorization', 'idor', 'bola', 'dmz', 'ids', 'ips', 'incident response'] },
  { domain: 'M3', topicId: 'M3-SEC-TECH', keywords: ['aes', 'rsa', 'tls', 'pki', 'digital signature', 'sql injection', 'xss', 'csrf', 'argon2', 'bcrypt', 'owasp'] },
  { domain: 'M4', topicId: 'M4-STRAT', keywords: ['swot', 'erp', 'crm', 'scm', 'roi', 'tco', 'digital transformation'] },
  { domain: 'M4', topicId: 'M4-PM', keywords: ['wbs', 'critical path', 'cpm', 'evm', 'cpi', 'spi', 'crashing', 'fast tracking'] },
  { domain: 'M4', topicId: 'M4-ETHICS', keywords: ['gpl', 'mit license', 'apache', 'copyright', 'privacy', 'gdpr', 'pipa', 'ethics'] },
];

export function analyzeExtractedPages(
  fileName: string,
  pages: ExtractedPdfPage[],
): PdfExtractionPreview {
  const fullText = pages.map((p) => p.text).join('\n');
  const lowerAll = fullText.toLowerCase();
  const warnings: string[] = [];

  if (fullText.trim().length < 80) {
    warnings.push(
      'Minimal text layer detected. This PDF may be scanned images; verify extracted fields manually instead of assuming missing content.',
    );
  }

  // Detect document type
  let documentType: StudySource['documentType'] = 'other';
  if (lowerAll.includes('score report') || lowerAll.includes('examinee average') || lowerAll.includes('competency level')) {
    documentType = 'score_report';
  } else if (lowerAll.includes('syllabus') || lowerAll.includes('v4.0')) {
    documentType = 'syllabus';
  } else if (lowerAll.includes('reviewer') || lowerAll.includes('study guide') || lowerAll.includes('topcit')) {
    documentType = 'study_guide';
  } else if (lowerAll.includes('lecture') || lowerAll.includes('chapter')) {
    documentType = 'lecture_notes';
  }

  // Detect year/version
  const yearMatch = fullText.match(/\b(202[0-9]|V[34]\.\d[A-Z]?)\b/i);
  const yearVersion = yearMatch ? yearMatch[0].toUpperCase() : 'Undated / Verify Version';

  // Extract concepts with exact page provenance
  const concepts: ExtractedConcept[] = [];
  const seenKey = new Set<string>();
  const domainSet = new Set<DomainId>();

  for (const page of pages) {
    const pageLower = page.text.toLowerCase();
    for (const sig of DOMAIN_SIGNATURES) {
      for (const kw of sig.keywords) {
        const pos = pageLower.indexOf(kw);
        if (pos !== -1 && !seenKey.has(`${sig.domain}:${kw}`)) {
          seenKey.add(`${sig.domain}:${kw}`);
          domainSet.add(sig.domain);
          const start = Math.max(0, pos - 40);
          const end = Math.min(page.text.length, pos + kw.length + 100);
          concepts.push({
            term: kw.toUpperCase(),
            snippet: page.text.slice(start, end).replace(/\s+/g, ' ').trim(),
            pageNumber: page.pageNumber,
            mappedDomain: sig.domain,
            mappedTopicId: sig.topicId,
          });
        }
      }
    }
  }

  if (concepts.length === 0) {
    warnings.push('No 2026 TOPCIT syllabus keywords matched automatically; manual domain tagging recommended.');
  }

  return {
    fileName,
    pageCount: pages.length,
    documentType,
    yearVersion,
    pages,
    concepts: concepts.slice(0, 40),
    mappedDomains: Array.from(domainSet),
    warnings,
  };
}

/**
 * Extracts text and table-like rows per page directly inside the browser using pdfjs-dist.
 * Preserves exact 1-based page provenance and never invents content when text is absent.
 */
export async function extractPdfFileInBrowser(file: File): Promise<PdfExtractionPreview> {
  const pdfjs = await import('pdfjs-dist');
  // Configure worker via Vite-friendly module URL
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: ExtractedPdfPage[] = [];

  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lines = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter((s) => s.trim().length > 0);
    const joined = lines.join(' ');
    const tableLikeLines = lines.filter((line) => /\d+\s*[/|]\s*\d+/.test(line) || line.includes('\t'));

    pages.push({
      pageNumber: p,
      text: joined,
      tableLikeLines,
    });
  }

  return analyzeExtractedPages(file.name, pages);
}

/**
 * Converts a verified PDF extraction preview into a source-linked PrepCIT Study Library lesson
 * preserving exact page citations (never reproducing copyrighted text wholesale).
 */
export function buildLessonFromPdfPreview(
  preview: PdfExtractionPreview,
  sourceId: string,
): Lesson {
  const primaryDomain: DomainId = preview.mappedDomains[0] ?? 'M3';
  const primaryTopicId = preview.concepts[0]?.mappedTopicId ?? `${primaryDomain}-SE`;

  const conceptLines =
    preview.concepts.length > 0
      ? preview.concepts
          .slice(0, 12)
          .map((c) => `- **${c.term}** (Page ${c.pageNumber}, ${c.mappedDomain}): ${c.snippet}...`)
          .join('\n')
      : '- Uploaded PDF contained limited machine-readable text; review original source pages directly.';

  return {
    id: `lesson-pdf-${sourceId}`,
    domain: primaryDomain,
    topicId: primaryTopicId,
    title: `Imported Notes: ${preview.fileName.replace(/\.pdf$/i, '')}`,
    summary: `Source-linked study summary extracted from ${preview.fileName} (${preview.pageCount} pages, detected ${preview.yearVersion}). Mapped to 2026 syllabus domains: ${preview.mappedDomains.join(', ') || primaryDomain}.`,
    contentMarkdown: `### Extracted 2026 Syllabus Concepts (Page-Provenance Verified)\n${conceptLines}`,
    glossary: preview.concepts.slice(0, 6).map((c) => ({
      term: `${c.term} (p.${c.pageNumber})`,
      definition: c.snippet || `Referenced on page ${c.pageNumber} of ${preview.fileName}.`,
    })),
    references: [
      {
        label: `${preview.fileName} (${preview.yearVersion})`,
        sourceId,
        pageNumber: preview.concepts[0]?.pageNumber ?? 1,
      },
    ],
    estimatedMinutes: Math.max(10, Math.min(45, preview.pageCount * 2)),
  };
}
