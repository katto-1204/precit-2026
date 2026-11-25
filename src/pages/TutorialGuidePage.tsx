import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Code2,
  Compass,
  GitBranch,
  Keyboard,
  ShieldAlert,
  Target,
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BLUEPRINT_2026, COMPETENCY_LEVELS } from '@/domain/blueprint2026';

const ONBOARDING_KEY = 'prepcit_tutorial_checklist_v1';

const ONBOARDING_STEPS = [
  {
    id: 'step-baseline',
    title: 'Inspect your verified 2025 baseline & weakness priorities',
    desc: 'Review your 197/1,000 diagnostic breakdown and confirm your Level 3 target score (450+).',
    to: '/dashboard',
    cta: 'Open Dashboard',
  },
  {
    id: 'step-security',
    title: 'Study your #2 weakness: M3 Information Security lesson',
    desc: 'Read CIA Triad, AuthN vs AuthZ (IDOR), Cryptography, and OWASP defenses in Study Library.',
    to: '/study-library?domain=M3&topic=M3-SEC-FUND',
    cta: 'Open M3 Lesson',
  },
  {
    id: 'step-diagram',
    title: 'Build & validate your first IBT Diagram',
    desc: 'Open Activity Diagram (Guided), drag/drop shapes onto the white grid, connect handles, open Inspector, and click Validate.',
    to: '/diagram-lab',
    cta: 'Open Diagram Studio',
  },
  {
    id: 'step-code-sql',
    title: 'Run Python (Pyodide) & grade a SQL query (sql.js)',
    desc: 'Execute real code and verify SQL result-set equivalence inside the Compiler & SQL Laboratory.',
    to: '/coding-lab',
    cta: 'Open Compiler & SQL Lab',
  },
  {
    id: 'step-integrated',
    title: 'Practice an 80-point Integrated multi-artifact scenario',
    desc: 'Target your #1 baseline weakness (15/260) by combining written design, diagram, and code/SQL.',
    to: '/integrated',
    cta: 'Open Integrated Lab',
  },
  {
    id: 'step-mock',
    title: 'Attempt the 75-Question, 150-Minute Full 2026 Mock Exam',
    desc: 'Use the left Navigator type pills (MCQ / Desc / Perf / Int) to pace all 1,000 points cleanly.',
    to: '/mock-exam',
    cta: 'Launch Full Mock',
  },
] as const;

export function TutorialGuidePage() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(checked));
    } catch {
      // ignore storage quota errors
    }
  }, [checked]);

  const doneCount = ONBOARDING_STEPS.filter((s) => checked[s.id]).length;
  const pct = Math.round((doneCount / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Interactive Tutorial &amp; TOPCIT 2026 Exam Guide
            </h1>
            <Badge variant="brand">
              <Compass className="h-3 w-3" />
              Complete Walkthrough
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Master every IBT simulator control, understand the 2026 scoring structure, and execute a proven 197 → 450+ Level 3 study plan.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/mock-exam">
            <ClipboardCheck className="h-4 w-4" />
            Try 75Q CBT Simulator
          </Link>
        </Button>
      </div>

      {/* Interactive Quick-Start Onboarding Checklist */}
      <Card className="border-brand-200 bg-brand-50/20">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Interactive Quick-Start Checklist ({doneCount}/{ONBOARDING_STEPS.length} Completed)</CardTitle>
              <CardDescription>
                Walk through these 6 hands-on steps to learn every tool in PrepCIT. Progress saves automatically in your browser.
              </CardDescription>
            </div>
            <Badge variant={pct === 100 ? 'success' : 'brand'}>{pct}% Complete</Badge>
          </div>
          <Progress value={pct} aria-label="Tutorial completion progress" className="mt-2" />
        </CardHeader>
        <CardContent className="grid gap-2.5 md:grid-cols-2">
          {ONBOARDING_STEPS.map((step, idx) => {
            const isDone = Boolean(checked[step.id]);
            return (
              <div
                key={step.id}
                className={`flex items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                  isDone ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() =>
                      setChecked((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                    }
                    className="mt-1 h-4 w-4 rounded accent-brand-600"
                  />
                  <div>
                    <p className={`text-xs font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {idx + 1}. {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{step.desc}</p>
                  </div>
                </label>
                <Button asChild size="sm" variant="outline" className="shrink-0 h-7 px-2.5 text-[11px]">
                  <Link to={step.to}>
                    {step.cta}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Deep-Dive Tutorial Tabs */}
      <Tabs defaultValue="ibt">
        <TabsList>
          <TabsTrigger value="ibt">1. Using the IBT Simulators</TabsTrigger>
          <TabsTrigger value="blueprint">2. 2026 Blueprint &amp; 150-Min Pacing</TabsTrigger>
          <TabsTrigger value="labs">3. Coding, SQL &amp; PDF Labs</TabsTrigger>
          <TabsTrigger value="playbook">4. 197 → 450+ Level 3 Playbook</TabsTrigger>
        </TabsList>

        {/* Tab 1: IBT Simulators */}
        <TabsContent value="ibt" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardCheck className="h-4 w-4 text-brand-600" />
                Full Mock Exam CBT Controls
              </CardTitle>
              <CardDescription>
                Exact workflow inside the 75-question, 150-minute simulator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <p className="font-semibold text-slate-900">Finding Non-MCQ Questions Instantly:</p>
                <p>
                  Use the <strong>Type Filter pills</strong> at the top of the Left Navigator:{' '}
                  <code className="rounded bg-white px-1 py-0.5 font-mono border">MCQ (60)</code>,{' '}
                  <code className="rounded bg-sky-50 px-1 py-0.5 font-mono border border-sky-200">Desc (7)</code>,{' '}
                  <code className="rounded bg-violet-50 px-1 py-0.5 font-mono border border-violet-200">Perf (5)</code>, and{' '}
                  <code className="rounded bg-brand-50 px-1 py-0.5 font-mono border border-brand-200">Int (3)</code>.
                </p>
                <p>
                  Tile tags show <strong className="text-sky-800">D</strong> (30p Descriptive),{' '}
                  <strong className="text-violet-800">P</strong> (50p Coding/SQL/Diagram), and{' '}
                  <strong className="text-brand-700">I</strong> (80p Integrated Multi-Artifact).
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-3 space-y-1.5">
                <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Keyboard className="h-3.5 w-3.5 text-brand-600" />
                  Keyboard Shortcuts
                </p>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li><strong>1 / 2 / 3 / 4</strong> — Select MCQ option A / B / C / D</li>
                  <li><strong>Alt + N</strong> or <strong>Alt + →</strong> — Next question</li>
                  <li><strong>Alt + P</strong> or <strong>Alt + ←</strong> — Previous question</li>
                  <li><strong>Alt + F</strong> — Flag / Unflag current item for review</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Reload &amp; Offline Safety:</strong> Every selection, diagram stroke, and line of code autosaves to IndexedDB. Your countdown uses a wall-clock deadline so refreshing never resets your exam.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-brand-600" />
                TOPCIT IBT Diagram Studio Guide
              </CardTitle>
              <CardDescription>
                How to draw, connect, style, validate, and export all 8 diagram types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <ol className="space-y-2 list-decimal pl-4">
                <li>
                  <strong>Insert Objects:</strong> Click any visual SVG symbol in the left palette OR drag and drop it anywhere onto the white graph-paper grid.
                </li>
                <li>
                  <strong>Connect Shapes:</strong> Pick a relationship type in the top toolbar (e.g., <code className="font-mono">Control Flow →</code>, <code className="font-mono">1 : N Crow’s Foot</code>, <code className="font-mono">&lt;&lt;include&gt;&gt;</code>), then drag from any red/slate handle dot on one shape to another.
                </li>
                <li>
                  <strong>Edit Text, UML Attributes &amp; Colors:</strong> Double-click any shape (or click <strong>Inspector</strong> in the top-right) to open the <strong>Text / Style / Arrange</strong> panel. Right-click a shape for quick Duplicate / Layer Order / Delete.
                </li>
                <li>
                  <strong>Structural Validation &amp; Export:</strong> Click <strong>Validate</strong> for layout-independent graph rubric scoring, <strong>Save</strong> to persist offline in IndexedDB, or export <strong>SVG / PNG / JSON</strong>.
                </li>
              </ol>
              <p className="font-mono text-[11px] text-slate-500">
                Shortcuts: Ctrl+Z Undo · Ctrl+Y Redo · Ctrl+C / Ctrl+V Copy/Paste · Delete Remove
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 2026 Blueprint & Pacing */}
        <TabsContent value="blueprint" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand-600" />
                  Recommended 150-Minute Pacing Budget
                </CardTitle>
                <CardDescription>
                  Never burn 120 minutes on 300-point MCQs and leave 490 points of Practical/Integrated tasks blank!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {[
                  ['60 Multiple Choice (300 pts)', '50–55 min (~50s / item)', 'Flag hard items; bank time for 50p/80p tasks.'],
                  ['7 Descriptive (210 pts)', '30–35 min (~4.5 min / item)', 'Answer every numbered sub-prompt concisely using bullet structure.'],
                  ['5 Standard Performance (250 pts)', '35–40 min (~7–8 min / item)', 'Write working Python/SQL + complete connected UML/ERD diagrams.'],
                  ['3 Integrated Performance (240 pts)', '25–30 min (~8–10 min / item)', 'Cover all deliverables partially rather than perfecting only 1 and leaving 2 blank!'],
                ].map(([block, budget, tip]) => (
                  <div key={block} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{block}</span>
                      <span className="font-mono text-brand-700">{budget}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-brand-600" />
                  Official TOPCIT Competency Levels (1,000 Pts)
                </CardTitle>
                <CardDescription>
                  Effective {BLUEPRINT_2026.effectiveDate} · Aim for Level 3 (400–649) minimum benchmark.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {COMPETENCY_LEVELS.map((lvl) => (
                  <div
                    key={lvl.level}
                    className={`flex items-start justify-between gap-3 rounded-md border p-2.5 ${
                      lvl.level === 3
                        ? 'border-brand-300 bg-brand-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{lvl.label}</p>
                      <p className="text-[11px] text-slate-600">{lvl.description}</p>
                    </div>
                    <span className="shrink-0 font-mono font-bold text-slate-800">
                      {lvl.minScore}–{lvl.maxScore}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Coding, SQL & PDF Labs */}
        <TabsContent value="labs" className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Code2 className="h-4 w-4 text-brand-600" />
                Compiler Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Python 3</strong> runs directly in your browser via an isolated Pyodide Web Worker with hard timeout termination against infinite loops.
              </p>
              <p>
                <strong>Hidden Tests:</strong> Visible sample cases show inputs/outputs, while hidden edge-case tests award partial credit without leaking hidden answers.
              </p>
              <p>
                <strong>C / C++ / Java:</strong> Supported via the optional local Docker sandbox (<code className="font-mono">server/sandbox-runner</code>) with <code className="font-mono">--network=none</code> and memory/CPU caps.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-brand-600" />
                SQLite WASM Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p>
                Uses <code className="font-mono">sql.js</code> in-browser with zero backend setup. Every execution spins up a fresh database so tests are 100% deterministic.
              </p>
              <p>
                Grading checks <strong>result-set equivalence</strong>, meaning any logically correct SQL query (joins, CTEs, subqueries) earns full credit!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                PDF Upload &amp; AI Tutor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p>
                Upload reviewer PDFs in <strong>Settings → PDF &amp; Source Library</strong>. PrepCIT extracts text locally with page numbers preserved and creates source-linked Study Library notes.
              </p>
              <p>
                <strong>AI Tutor</strong> works live with Gemini Flash when <code className="font-mono">GEMINI_API_KEY</code> is set on Netlify/server, and falls back seamlessly to local 2026 curriculum lookup offline.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: 197 -> 450+ Playbook */}
        <TabsContent value="playbook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-brand-600" />
                Your Targeted 6-Week Strategy: 197 (Level 2) → 450+ (Level 3 Competent)
              </CardTitle>
              <CardDescription>
                Grounded in your December 10, 2025 score breakdown (197/1,000, 25/65 correct).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-xs">
              {[
                {
                  phase: 'Weeks 1–2 · Fix Critical Foundation Gaps',
                  points: 'Target: +90 pts gain',
                  detail:
                    'Eliminate the 5/85 Information Security deficit (M3 lessons + security drills: CIA Triad, IDOR, TLS/PKI, Argon2id, SQLi/XSS/CSRF) and finish all M1 UML & Algorithm fundamentals.',
                },
                {
                  phase: 'Weeks 3–4 · Practical Coding, SQL & Diagrams',
                  points: 'Target: +100 pts gain',
                  detail:
                    'Master 50-pt tasks in Coding Lab (Rate Limiter, Graph Cycle Debugging), SQL Lab (Weighted GPA, LEFT JOIN trap), and Diagram Studio (Activity, Class, ERD, 3-Tier DMZ Component).',
                },
                {
                  phase: 'Week 5 · 80-Point Integrated Bootcamp',
                  points: 'Target: +75 pts gain',
                  detail:
                    'Conquer your #1 weakness (15/260 Integrated) by solving all three 80-pt multi-artifact scenarios in Integrated Challenges, always scoring against every rubric criterion.',
                },
                {
                  phase: 'Week 6 · Full Timed 150-Min Mock & Mistake Review',
                  points: 'Target: 450+ Verified Score',
                  detail:
                    'Take the 75-question Full Mock under strict 150-minute pacing, grade pending tasks honestly in Results & Analytics, tag error causes, and clear your Mistake Review queue.',
                },
              ].map((block) => (
                <div key={block.phase} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{block.phase}</h3>
                    <Badge variant="brand">{block.points}</Badge>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-slate-600">{block.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
