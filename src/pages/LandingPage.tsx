import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Compass,
  Database,
  Flame,
  GitBranch,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  WifiOff,
} from 'lucide-react';
import { DiagramCategoryPreview } from '@/components/labs/PaletteShapeIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BLUEPRINT_2026 } from '@/domain/blueprint2026';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 font-mono text-sm font-bold text-white">
              PC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">PrepCIT</span>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-700">
                  2026 IBT
                </span>
              </div>
              <p className="hidden text-[10px] text-slate-500 sm:block">
                Unofficial TOPCIT Exam Simulator
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-medium text-slate-600 md:flex">
            <a href="#blueprint" className="hover:text-slate-900">
              2026 Blueprint
            </a>
            <a href="#simulators" className="hover:text-slate-900">
              IBT Simulators
            </a>
            <Link to="/guide" className="hover:text-slate-900">
              Tutorial &amp; Guide
            </Link>
            <Link to="/diagram-lab" className="hover:text-slate-900">
              Diagram Studio
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/guide">
                <Compass className="h-3.5 w-3.5" />
                Tutorial Guide
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/dashboard">
                Open Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] [background-size:32px_32px]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:items-center lg:py-20">
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">Aligned to Revised May 16, 2026 TOPCIT Blueprint</Badge>
              <Badge variant="neutral">
                <WifiOff className="h-3 w-3" />
                Offline PWA · Zero API Keys Required
              </Badge>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.1]">
              Train on real <span className="text-brand-600">TOPCIT 2026 IBT</span> simulations—not just flashcards.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              PrepCIT combines a full <strong>75-question, 150-minute CBT exam engine</strong>,{' '}
              <strong>8 interactive UML/ERD/Wireframe diagram studios</strong>, live{' '}
              <strong>Python &amp; SQLite WASM compilers</strong>, and adaptive weakness remediation
              designed to move you from <strong>Level 2 (197/1,000)</strong> to{' '}
              <strong>Level 3+ Competent (400–649+)</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Enter Study Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/mock-exam">
                  <ClipboardCheck className="h-4 w-4" />
                  Launch 75Q Full Mock Exam
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/guide">
                  <Compass className="h-4 w-4" />
                  Read Interactive Tutorial
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {[
                ['75 Items', '1,000 Pts · 150 Min'],
                ['8 Editors', 'UML, ERD, Flow, UI'],
                ['Live Labs', 'Python + SQLite WASM'],
                ['Local DB', 'Reload & Offline Safe'],
              ].map(([title, sub]) => (
                <div key={title} className="rounded-md border border-slate-200 bg-white/95 px-3 py-2.5 shadow-2xs">
                  <p className="font-mono text-sm font-bold text-slate-900">{title}</p>
                  <p className="text-[11px] text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hero Live Diagnostic Preview Card */}
          <div className="lg:col-span-5">
            <Card className="border-slate-300 bg-white shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Personalized Trajectory
                    </p>
                    <h2 className="text-base font-bold text-slate-900">
                      Level 2 Baseline → Level 3+ Target
                    </h2>
                  </div>
                  <Badge variant="brand">Verified 2025 Data</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] text-slate-500">Dec 10, 2025 Baseline</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      197<span className="text-xs font-normal text-slate-500">/1000</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">Level 2 · 25/65 correct</p>
                  </div>
                  <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3.5">
                    <p className="text-[11px] text-brand-700">2026 Level 3 Goal</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-brand-700 tabular-nums">
                      450<span className="text-xs font-normal text-brand-600/80">/1000</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-brand-800">Competent · Top 30%+</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    Top High-ROI Focus Areas Pre-Loaded:
                  </p>
                  {[
                    ['#1 Integrated Problem Solving', '80-pt cross-domain scenarios (M1–M3)', 'danger'],
                    ['#2 Information Security', 'OWASP, Cryptography, PKI, Zero-Trust (M3)', 'danger'],
                    ['#3 Software Development', 'Highest 2026 weight: 365/1,000 pts (M1)', 'warning'],
                  ].map(([name, detail, tone]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="text-[11px] text-slate-500">{detail}</p>
                      </div>
                      <Badge variant={tone as 'danger' | 'warning'}>Priority</Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button asChild className="flex-1" size="sm">
                    <Link to="/dashboard">View Full Baseline</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1" size="sm">
                    <Link to="/diagram-lab">Try Diagram Studio</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 2026 Blueprint Matrix Section */}
      <section id="blueprint" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <Badge variant="neutral">Verified Official 2026 Specification</Badge>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Built Strictly Around the Revised 75-Question Blueprint
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Short-answer items are abolished in 2026. Over <strong>70% of all exam points (700/1,000)</strong> now come from Descriptive (210p), Standard Performance (250p), and Integrated Performance (240p) tasks.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BLUEPRINT_2026.domainOrder.map((domainId) => {
            const d = BLUEPRINT_2026.domains[domainId];
            return (
              <Card key={domainId}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                      {d.code}
                    </span>
                    <span className="font-mono text-lg font-bold text-brand-600 tabular-nums">
                      {d.totalPoints} pts
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{d.name}</h3>
                  <p className="text-xs leading-relaxed text-slate-600">{d.description}</p>
                  <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 font-mono text-[11px] text-slate-600">
                    <span>MCQ: {d.counts.mcq} × 5p</span>
                    <span>Desc: {d.counts.descriptive} × 30p</span>
                    <span>Perf: {d.counts.standard_performance} × 50p</span>
                    <span>Int: {d.counts.integrated_performance} × 80p</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interactive IBT Simulators Showcase */}
      <section id="simulators" className="border-y border-slate-200 bg-slate-50/80 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="brand">Zero Static Mockups — Every Workspace Runs Live</Badge>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Complete TOPCIT IBT Training Suite
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/guide">
                <BookOpen className="h-3.5 w-3.5" />
                See Step-by-Step Tutorial
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                to: '/mock-exam',
                icon: ClipboardCheck,
                title: '75-Question CBT Mock Simulator',
                badge: '150 Min · Reload-Safe',
                desc: 'Full 1,000-point timed exam with visual exhibits, type-filtered navigator, embedded Code/SQL/Diagram tabs, and zero pre-submission answer leakage.',
              },
              {
                to: '/diagram-lab',
                icon: GitBranch,
                title: '8 Interactive TOPCIT Diagram Studios',
                badge: 'Activity · Class · ERD · UI',
                desc: 'Crisp light graph-paper canvas with visual SVG symbol palettes, drag/drop, connector styles, Style/Text/Arrange inspector, rubric validation, and SVG/PNG export.',
              },
              {
                to: '/coding-lab',
                icon: Code2,
                title: 'Compiler & SQLite WASM Laboratory',
                badge: 'Python · SQL · C/C++/Java',
                desc: 'Monaco Editor executing Python 3 in isolated Pyodide Web Workers and grading SQL via fresh-DB sql.js result-set equivalence.',
              },
              {
                to: '/integrated',
                icon: Flame,
                title: '80-Pt Integrated Multi-Artifact Lab',
                badge: '#1 Weakness Target',
                desc: 'Cross-domain workplace scenarios combining written architecture design, interactive diagramming, code/SQL scratchpad, and 80-pt rubrics.',
              },
              {
                to: '/study-library',
                icon: Database,
                title: 'Study Library & Local PDF Ingestor',
                badge: 'M1–M4 + Page Provenance',
                desc: 'Structured lessons, worked TOPCIT examples, searchable glossary, CHED/official links, plus browser-local PDF extraction preserving exact page numbers.',
              },
              {
                to: '/analytics',
                icon: BarChart3,
                title: 'Transparent Analytics & AI Tutor',
                badge: 'Weighted vs Accuracy',
                desc: 'Separates evaluated score, pending rubrics, and raw accuracy with M1–M4 radar charts, auto-graders, 7 error-cause categories, and Gemini Flash fallback.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 transition-all hover:border-brand-400 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="neutral">{item.badge}</Badge>
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-brand-700">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.desc}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                    Open Workspace
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* 4 Mini Visual Diagram Previews */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive IBT Diagram Studio Preview (All 8 Official Categories Included)
                </h3>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/diagram-lab">Open All 8 Editors</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ['uml_activity', 'Activity Diagram'],
                  ['uml_class', 'Class Diagram'],
                  ['er_diagram', 'ER Diagram'],
                  ['use_case', 'Use Case Diagram'],
                ] as const
              ).map(([type, label]) => (
                <Link key={type} to="/diagram-lab" className="group space-y-1.5">
                  <DiagramCategoryPreview type={type} />
                  <p className="text-center text-xs font-semibold text-slate-700 group-hover:text-brand-700">
                    {label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-slate-950 px-6 py-10 text-white">
          <Badge variant="brand" className="mb-3">
            <Sparkles className="h-3 w-3" />
            Ready to Start?
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Follow the 5-Minute Interactive Tutorial or Jump Right Into Practice
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
            All study progress, diagrams, and mock exam attempts persist offline inside your browser’s IndexedDB with 1-click JSON export/import.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/guide">
                <Compass className="h-4 w-4" />
                Start Interactive Tutorial Guide
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link to="/dashboard">
                <Target className="h-4 w-4" />
                Go to My Dashboard
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Exact 2026 Blueprint Verified
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Unofficial Practice Platform (No Official Affiliation)
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
        PrepCIT — Unofficial 2026 TOPCIT-Style Simulator &amp; Learning Platform. Original practice items &amp; transparent scoring rubrics only.
      </footer>
    </div>
  );
}
