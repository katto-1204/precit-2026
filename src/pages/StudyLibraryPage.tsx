import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OFFICIAL_STUDY_REFERENCES } from '@/data/lessons_seed';
import { logStudySession } from '@/db/backup';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import { BLUEPRINT_2026, type DomainId } from '@/domain/blueprint2026';
import { MASTERY_STATE_META } from '@/domain/learningEngine';
import { getTopicById } from '@/domain/syllabus2026';

function renderStructuredLessonBlocks(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <pre
            key={`code-${index}`}
            className="my-3 overflow-x-auto rounded-md border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-slate-100"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>,
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${index}`} className="mt-5 mb-2 text-sm font-bold text-slate-900">
          {line.replace('### ', '')}
        </h3>,
      );
      return;
    }

    if (line.startsWith('- ')) {
      blocks.push(
        <li key={`li-${index}`} className="ml-4 list-disc text-sm leading-relaxed text-slate-700">
          {renderInlineFormatting(line.slice(2))}
        </li>,
      );
      return;
    }

    if (line.trim().length > 0) {
      blocks.push(
        <p key={`p-${index}`} className="my-2 text-sm leading-relaxed text-slate-700">
          {renderInlineFormatting(line)}
        </p>,
      );
    }
  });

  return blocks;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-brand-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function StudyLibraryPage() {
  const [searchParams] = useSearchParams();
  const initialDomain = (searchParams.get('domain') as DomainId | null) ?? 'ALL';
  const initialTopic = searchParams.get('topic');

  const lessons = useLiveQuery(() => db.lessons.toArray(), []) ?? [];
  const topicMastery = useLiveQuery(() => db.topicMastery.toArray(), []) ?? [];
  const questions = useLiveQuery(() => db.questions.toArray(), []) ?? [];

  const [domainFilter, setDomainFilter] = useState<DomainId | 'ALL'>(
    ['M1', 'M2', 'M3', 'M4'].includes(initialDomain) ? initialDomain : 'ALL',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [completedBanner, setCompletedBanner] = useState<string | null>(null);

  const masteryByTopic = useMemo(
    () => new Map(topicMastery.map((m) => [m.topicId, m])),
    [topicMastery],
  );

  const filteredLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (domainFilter !== 'ALL' && lesson.domain !== domainFilter) return false;
      if (!q) return true;
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.summary.toLowerCase().includes(q) ||
        lesson.contentMarkdown.toLowerCase().includes(q) ||
        lesson.glossary.some(
          (g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q),
        )
      );
    });
  }, [lessons, domainFilter, searchQuery]);

  const activeLesson = useMemo(() => {
    if (selectedLessonId) {
      const found = filteredLessons.find((l) => l.id === selectedLessonId);
      if (found) return found;
    }
    if (initialTopic) {
      const byTopic = filteredLessons.find((l) => l.topicId === initialTopic);
      if (byTopic) return byTopic;
    }
    return filteredLessons[0] ?? null;
  }, [filteredLessons, selectedLessonId, initialTopic]);

  const allGlossary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons
      .flatMap((l) =>
        l.glossary.map((g) => ({
          ...g,
          domain: l.domain,
          topicId: l.topicId,
          lessonTitle: l.title,
        })),
      )
      .filter((item) => {
        if (domainFilter !== 'ALL' && item.domain !== domainFilter) return false;
        if (!q) return true;
        return (
          item.term.toLowerCase().includes(q) ||
          item.definition.toLowerCase().includes(q) ||
          item.lessonTitle.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [lessons, domainFilter, searchQuery]);

  const topicQuestionCount = activeLesson
    ? questions.filter((q) => q.domain === activeLesson.domain && q.topicId === activeLesson.topicId)
        .length
    : 0;

  async function handleMarkReviewed() {
    if (!activeLesson) return;
    await logStudySession(activeLesson.estimatedMinutes, 0, `Lesson: ${activeLesson.title}`);
    setCompletedBanner(
      `Logged ${activeLesson.estimatedMinutes} study minutes for "${activeLesson.title}" to your local streak.`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Study Library (2026 Syllabus M1–M4)
            </h1>
            <Badge variant="brand">{lessons.length} Core Lessons</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Structured Mode 1 (Learn) lessons, worked TOPCIT examples, searchable glossary, and mapped official/CHED references.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            aria-label="Search lessons and glossary"
            placeholder="Search concepts, SQL, OWASP, EVM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Domain Filter Pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by 2026 domain">
        <Button
          size="sm"
          variant={domainFilter === 'ALL' ? 'primary' : 'outline'}
          onClick={() => setDomainFilter('ALL')}
        >
          All Domains ({lessons.length})
        </Button>
        {BLUEPRINT_2026.domainOrder.map((domainId) => {
          const spec = BLUEPRINT_2026.domains[domainId];
          const count = lessons.filter((l) => l.domain === domainId).length;
          return (
            <Button
              key={domainId}
              size="sm"
              variant={domainFilter === domainId ? 'primary' : 'outline'}
              onClick={() => setDomainFilter(domainId)}
            >
              {domainId}: {spec.shortName} ({count})
            </Button>
          );
        })}
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons &amp; Worked Examples</TabsTrigger>
          <TabsTrigger value="glossary">Glossary ({allGlossary.length})</TabsTrigger>
          <TabsTrigger value="references">Official &amp; Foundational PDFs</TabsTrigger>
        </TabsList>

        {/* Lessons Master-Detail */}
        <TabsContent value="lessons">
          {filteredLessons.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-slate-500">
                No lessons matched your current domain and search filter. Clear the search box to browse all M1–M4 lessons.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Lesson List */}
              <div className="space-y-2.5 lg:col-span-4">
                {filteredLessons.map((lesson) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const mastery = masteryByTopic.get(lesson.topicId);
                  const stateMeta = mastery
                    ? MASTERY_STATE_META[mastery.state]
                    : MASTERY_STATE_META.not_started;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setSelectedLessonId(lesson.id);
                        setCompletedBanner(null);
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-brand-600 bg-brand-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                            {lesson.domain}
                          </span>
                          <Badge variant={stateMeta.tone}>{stateMeta.label}</Badge>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          {lesson.estimatedMinutes}m
                        </span>
                      </div>
                      <h2 className="mt-2 text-sm font-semibold text-slate-900">{lesson.title}</h2>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{lesson.summary}</p>
                    </button>
                  );
                })}
              </div>

              {/* Active Lesson Detail */}
              {activeLesson ? (
                <div className="space-y-4 lg:col-span-8">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand">
                            {activeLesson.domain} · {BLUEPRINT_2026.domains[activeLesson.domain].name}
                          </Badge>
                          <Badge variant="neutral">
                            {getTopicById(activeLesson.topicId)?.code ?? activeLesson.topicId}
                          </Badge>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                          <BookOpen className="h-3.5 w-3.5" />
                          Est. {activeLesson.estimatedMinutes} min
                        </span>
                      </div>
                      <CardTitle className="mt-2 text-lg">{activeLesson.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {activeLesson.summary}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {completedBanner ? (
                        <div
                          role="status"
                          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>{completedBanner}</span>
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        {renderStructuredLessonBlocks(activeLesson.contentMarkdown)}
                      </div>

                      {activeLesson.workedExample ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                            <Lightbulb className="h-4 w-4 text-amber-600" />
                            Worked TOPCIT Example
                          </div>
                          <div className="space-y-1">
                            {renderStructuredLessonBlocks(activeLesson.workedExample)}
                          </div>
                        </div>
                      ) : null}

                      {activeLesson.glossary.length > 0 ? (
                        <div>
                          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Key Terms in This Lesson
                          </h3>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {activeLesson.glossary.map((item) => (
                              <div
                                key={item.term}
                                className="rounded-md border border-slate-200 bg-slate-50/70 p-3"
                              >
                                <p className="text-xs font-semibold text-slate-900">{item.term}</p>
                                <p className="mt-1 text-xs text-slate-600">{item.definition}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {activeLesson.references.length > 0 ? (
                        <div className="border-t border-slate-100 pt-4">
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Source References
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {activeLesson.references.map((ref) =>
                              ref.url ? (
                                <a
                                  key={ref.label}
                                  href={ref.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  {ref.label}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <Badge key={ref.label} variant="neutral">
                                  {ref.label}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                        <Button variant="outline" size="sm" onClick={handleMarkReviewed}>
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Lesson Reviewed (+{activeLesson.estimatedMinutes}m)
                        </Button>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link
                              to={`/practice?domain=${activeLesson.domain}&topic=${activeLesson.topicId}&mode=guided`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Practice Topic ({topicQuestionCount}Q)
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link to={`/practice?domain=${activeLesson.domain}&mode=guided`}>
                              All {activeLesson.domain} Drills
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>

        {/* Full Searchable Glossary */}
        <TabsContent value="glossary">
          <Card>
            <CardHeader>
              <CardTitle>TOPCIT 2026 Core Technical Glossary</CardTitle>
              <CardDescription>
                {allGlossary.length} high-yield definitions across M1–M4. Use the search box above to filter instantaneously.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {allGlossary.map((entry) => (
                <div
                  key={`${entry.domain}-${entry.term}`}
                  className="rounded-md border border-slate-200 bg-slate-50/60 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{entry.term}</h3>
                    <Badge variant="neutral">{entry.domain}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{entry.definition}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Official & Foundational PDF References */}
        <TabsContent value="references">
          <Card>
            <CardHeader>
              <CardTitle>Official TOPCIT &amp; Foundational CHED Reviewer Sources</CardTitle>
              <CardDescription>
                Older CHED/TOPCIT PDF reviewers provide foundational concepts and are mapped transparently onto the revised 2026 M1–M4 syllabus. Local PDF upload &amp; page-provenance extraction unlocks in Phase 5.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {OFFICIAL_STUDY_REFERENCES.map((ref) => (
                <div
                  key={ref.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ref.domain === 'ALL' ? 'brand' : 'neutral'}>
                        {ref.domain}
                      </Badge>
                      <h3 className="text-sm font-semibold text-slate-900">{ref.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{ref.note}</p>
                  </div>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Open Source
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
