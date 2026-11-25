import { useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, PlusCircle, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/db/database';
import { BLUEPRINT_2026, type Difficulty, type DomainId } from '@/domain/blueprint2026';
import { QuestionSchema, type Question } from '@/domain/schemas';
import { getTopicsByDomain } from '@/domain/syllabus2026';
import { askPrepCitTutor, type TutorReply } from '@/lib/aiTutorClient';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  meta?: TutorReply;
}

const QUICK_PROMPTS = [
  'Explain SQL Injection vs XSS vs CSRF with exact primary defenses for M3.',
  'Walk through BCNF vs 3NF normalization with a concrete university enrollment example.',
  'How do I avoid the LEFT JOIN + WHERE trap in TOPCIT M2 SQL tasks?',
  'Compute SPI and CPI when PV=$400k, EV=$320k, AC=$440k and suggest recovery steps.',
];

export function AiTutorPage() {
  const [mode, setMode] = useState<'tutor' | 'descriptive_feedback' | 'weakness_plan' | 'question_draft'>('tutor');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draftDomain, setDraftDomain] = useState<DomainId>('M3');
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>('medium');
  const [pendingDraft, setPendingDraft] = useState<Question | null>(null);
  const [draftFeedback, setDraftFeedback] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  async function handleGenerateDraft() {
    setGeneratingDraft(true);
    setDraftFeedback(null);
    const topic = getTopicsByDomain(draftDomain)[0];
    try {
      const apiBase = (import.meta.env.VITE_AI_API_BASE as string | undefined) ?? '';
      const res = await fetch(`${apiBase}/api/ai/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: draftDomain,
          topicId: topic?.id ?? `${draftDomain}-SE`,
          difficulty: draftDifficulty,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; draft?: unknown; error?: string };
      if (!res.ok || !data.ok || !data.draft) {
        throw new Error(data.error ?? 'Gemini backend not configured.');
      }
      const parsed = QuestionSchema.safeParse(data.draft);
      if (!parsed.success) {
        throw new Error(`AI draft failed Zod validation: ${parsed.error.issues[0]?.message}`);
      }
      setPendingDraft(parsed.data);
      setDraftFeedback('Generated AI draft validated with Zod. Review carefully before approving.');
    } catch (err) {
      // Offline / No-key deterministic original draft template for manual authoring
      const fallbackDraft = QuestionSchema.parse({
        id: `DRAFT-${draftDomain}-${Date.now()}`,
        title: `Custom ${draftDomain} Practice Draft (${topic?.title ?? draftDomain})`,
        prompt: `Write a focused 2026 TOPCIT ${draftDomain} practice scenario testing ${topic?.title ?? draftDomain} (${draftDifficulty} difficulty).`,
        domain: draftDomain,
        topicId: topic?.id ?? `${draftDomain}-SE`,
        difficulty: draftDifficulty,
        questionType: 'mcq',
        pointValue: 5,
        options: [
          { id: 'A', text: 'Option A — edit before approving' },
          { id: 'B', text: 'Option B — edit before approving' },
          { id: 'C', text: 'Option C — edit before approving' },
          { id: 'D', text: 'Option D — edit before approving' },
        ],
        correctOptionId: 'A',
        explanation: 'Provide clear syllabus-grounded reasoning before approving into your bank.',
        references: [{ label: `Custom Draft — ${draftDomain}` }],
        sourceClassification: 'ai_draft_pending',
        contentVersion: '2026.1.0-draft',
        reviewStatus: 'draft',
        estimatedSeconds: 75,
      });
      setPendingDraft(fallbackDraft);
      setDraftFeedback(
        `${err instanceof Error ? err.message : 'Gemini offline.'} Loaded an editable draft template below so you can author & approve offline.`,
      );
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function handleApproveDraft() {
    if (!pendingDraft) return;
    const verified: Question = QuestionSchema.parse({
      ...pendingDraft,
      reviewStatus: 'verified',
    });
    await db.questions.put(verified);
    setPendingDraft(null);
    setDraftFeedback(
      `Approved "${verified.title}" into your local IndexedDB Practice Hub question bank (source: ai_draft_pending -> verified).`,
    );
  }

  async function handleAsk(promptText?: string) {
    const query = (promptText ?? input).trim();
    if (!query || loading) return;

    const userTurn: ChatTurn = { id: `u-${Date.now()}`, role: 'user', text: query };
    setTurns((prev) => [...prev, userTurn]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askPrepCitTutor(query, mode);
      setTurns((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply.answer,
          meta: reply,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              AI Tutor &amp; Gemini Study Assistant
            </h1>
            <Badge variant="brand">Gemini Free-Tier Proxy + Offline Fallback</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Routes through the secure backend proxy (<code className="font-mono text-xs">server/api/index.mjs</code>) so API keys never enter the browser. Works offline via local syllabus retrieval.
          </p>
        </div>
      </div>

      {/* Mode Selector + Security Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['tutor', 'Concept Tutor'],
              ['descriptive_feedback', 'Descriptive Draft Estimate'],
              ['weakness_plan', 'Weakness Diagnosis'],
              ['question_draft', 'Original Practice Draft'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={mode === id ? 'primary' : 'outline'}
              onClick={() => setMode(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Disabled during timed CBT mock exams
        </span>
      </div>

      {/* AI Question Draft Generator & Review Queue */}
      {mode === 'question_draft' ? (
        <Card className="border-brand-200 bg-brand-50/20">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PlusCircle className="h-4 w-4 text-brand-600" />
                  Original Practice Question Generator &amp; Review Gate
                </CardTitle>
                <CardDescription>
                  Generated questions enter <code className="font-mono">ai_draft_pending</code> review state and are validated with Zod before approval into Practice Hub.
                </CardDescription>
              </div>
              <Badge variant="warning">Pending Human Review</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Draft domain"
                value={draftDomain}
                onChange={(e) => setDraftDomain(e.target.value as DomainId)}
                className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs"
              >
                {BLUEPRINT_2026.domainOrder.map((d) => (
                  <option key={d} value={d}>
                    {d} — {BLUEPRINT_2026.domains[d].name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Draft difficulty"
                value={draftDifficulty}
                onChange={(e) => setDraftDifficulty(e.target.value as Difficulty)}
                className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <Button size="sm" disabled={generatingDraft} onClick={() => void handleGenerateDraft()}>
                <Sparkles className="h-3.5 w-3.5" />
                {generatingDraft ? 'Generating...' : 'Generate Draft Question'}
              </Button>
            </div>

            {draftFeedback ? (
              <div role="status" className="rounded border border-slate-200 bg-white p-2.5 text-slate-700">
                {draftFeedback}
              </div>
            ) : null}

            {pendingDraft ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="warning">Source: AI-Generated Draft — Pending Validation</Badge>
                  <span className="font-mono text-[11px] text-slate-500">{pendingDraft.id}</span>
                </div>
                <input
                  aria-label="Draft title"
                  value={pendingDraft.title}
                  onChange={(e) => setPendingDraft({ ...pendingDraft, title: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-900"
                />
                <textarea
                  aria-label="Draft prompt"
                  rows={3}
                  value={pendingDraft.prompt}
                  onChange={(e) => setPendingDraft({ ...pendingDraft, prompt: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2.5 text-slate-800"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  {(pendingDraft.options ?? []).map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-600">{opt.id}.</span>
                      <input
                        aria-label={`Draft option ${opt.id}`}
                        value={opt.text}
                        onChange={(e) => {
                          const nextOpts = (pendingDraft.options ?? []).map((o, i) =>
                            i === idx ? { ...o, text: e.target.value } : o,
                          );
                          setPendingDraft({ ...pendingDraft, options: nextOpts });
                        }}
                        className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    Correct Answer:
                    <select
                      value={pendingDraft.correctOptionId}
                      onChange={(e) =>
                        setPendingDraft({
                          ...pendingDraft,
                          correctOptionId: e.target.value as 'A' | 'B' | 'C' | 'D',
                        })
                      }
                      className="h-7 rounded border border-slate-300 bg-white px-2 font-mono"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPendingDraft(null)}>
                      Discard
                    </Button>
                    <Button size="sm" onClick={() => void handleApproveDraft()}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve &amp; Add to Question Bank
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Prompts */}
      <div className="grid gap-2 sm:grid-cols-2">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            type="button"
            onClick={() => void handleAsk(qp)}
            className="rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs text-slate-700 hover:border-brand-400 hover:bg-brand-50/40 cursor-pointer"
          >
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-brand-600" />
            {qp}
          </button>
        ))}
      </div>

      {/* Conversation Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-brand-600" />
            Interactive Study Session
          </CardTitle>
          <CardDescription>
            AI-assisted feedback is always explicitly labeled as an estimate and never misrepresented as official TOPCIT grading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {turns.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
              Ask any 2026 TOPCIT concept, paste a descriptive draft for rubric feedback, or click a quick prompt above.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-lg border p-4 text-xs leading-relaxed ${
                    turn.role === 'user'
                      ? 'ml-8 border-brand-200 bg-brand-50/50 text-slate-900'
                      : 'mr-8 border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {turn.meta ? (
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            turn.meta.source === 'gemini_backend' ? 'brand' : 'neutral'
                          }
                        >
                          {turn.meta.modelLabel}
                        </Badge>
                        {turn.meta.cached ? <Badge variant="info">Cached</Badge> : null}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        {turn.meta.disclaimer}
                      </span>
                    </div>
                  ) : null}
                  <div className="whitespace-pre-line">{turn.text}</div>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAsk();
            }}
            className="flex gap-2"
          >
            <input
              aria-label="Ask PrepCIT AI Tutor"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about OWASP, BCNF, UML Composition, CIDR subnetting, EVM, or paste a descriptive answer..."
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-600"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
              {loading ? 'Thinking...' : 'Ask'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
