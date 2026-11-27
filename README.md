# PrepCIT — Unofficial 2026 TOPCIT IBT Exam Simulator & Personalized Learning Platform

[![Live on Netlify](https://img.shields.io/badge/Live-prepcit--2026.netlify.app-c81e1e?style=flat-square)](https://prepcit-2026.netlify.app)
[![Blueprint](https://img.shields.io/badge/TOPCIT_2026-75Q_%C2%B7_1000_pts_%C2%B7_150_min-0f172a?style=flat-square)](#verified-2026-topcit-blueprint)
[![Offline PWA](https://img.shields.io/badge/Offline_First-IndexedDB_%2B_PWA-059669?style=flat-square)](#architecture--tech-stack)

**Live Demo:** https://prepcit-2026.netlify.app

> **Academic & Non-Affiliation Disclaimer:** PrepCIT is an **unofficial**, independent study and examination simulation platform built for BSIT students preparing for the revised **2026 TOPCIT** examination. It is not affiliated with IITP or TOPCIT, does not redistribute proprietary exam banks, and strictly separates original practice items and AI-assisted estimates from official TOPCIT scoring.

---

## Core Concept & Learning Philosophy

PrepCIT was designed to bridge a real, verified learner gap — moving from a **December 10, 2025 baseline of 197/1,000 (25/65, Level 2)** toward **Level 3+ Competent (450+/1,000)** on the revised **May 16, 2026** exam — without feeling overwhelming or relying solely on easy multiple-choice flashcards.

1. **Zero-Intimidation Learning Modes (Hints, Warm-Ups & Worked Examples)**
   - **7-Stop Interactive Guided Tour** docked below the top bar (`Guided Tour`), walking learners live across the app from Dashboard to Mock Exam.
   - **Plain-English Situation Breakdowns & 3-Step Progressive Hints** (`HintCoachDrawer`) across Practice Hub, Coding & SQL Lab, Diagram Lab, and 80-Point Integrated Challenges — explaining what intimidating exam prompts actually mean before spoiling the solution.
   - **Ready-Made Sandboxes & Worked Examples**: 1-click **SQL 101** (5 live SQLite lessons) + **Peek Rows** table inspector, **Python 101** warm-ups, **Fill-in-the-Blank** scaffolds, and **100%-passing Worked Examples** for all 8 diagram types.
2. **Strict Exam-Day Integrity in Full Mock Mode**
   - In **Full Mock Exam (`/mock-exam`)** and timed drills, hints and explanations remain **strictly locked** until submission.
   - Blank/unfinished tasks always score **0 points**; ungraded written/practical items remain transparently marked as **Pending Evaluation** (never inflated into evaluated score totals).
   - Verified 2025 historical scores are preserved as historical baseline evidence and never falsely converted into 2026 scores.
3. **100% Local-First Offline PWA**
   - All study progress, topic mastery (SM-2 spaced repetition), exam attempts, autosaved answers, saved diagrams, and PDF imports persist in browser **IndexedDB (Dexie)** with Zod-validated JSON backup/restore. Zero API keys required to use the full platform.

---

## Verified 2026 TOPCIT Blueprint

Effective **May 16, 2026** (**75 questions · 1,000 points · 150 minutes · 4 domains**):

| Domain | MCQ (5 pts) | Descriptive (30 pts) | Standard Perf (50 pts) | Integrated Perf (80 pts) | Total Q | Total Pts |
|---|---:|---:|---:|---:|---:|---:|
| **M1 — Software Development** | 15 | 2 | 3 | 1 | **21** | **365** |
| **M2 — Data Management** | 15 | 2 | 1 | 1 | **19** | **265** |
| **M3 — Systems Architecture & InfoSec** | 15 | 1 | 1 | 1 | **18** | **235** |
| **M4 — IT Business** | 15 | 2 | 0 | 0 | **17** | **135** |
| **Total** | **60 (300)** | **7 (210)** | **5 (250)** | **3 (240)** | **75** | **1,000** |

---

## Complete 14-Screen Platform Map

| # | Route | Screen | What It Does |
|---:|---|---|---|
| 1 | `/` | **Landing Page** (`LandingPage.tsx`) | Public overview of the 2026 blueprint, verified `197 → 450+` diagnostic preview, 6 IBT simulator showcases, SVG diagram previews, and 1-click entry to Dashboard, Mock Exam, Tutorial Guide, or 1-Minute Guided Tour. |
| 2 | `/dashboard` | **Study Dashboard** (`DashboardPage.tsx`) | Displays verified Dec 10, 2025 baseline (`197/1000`, Level 2) alongside benchmark references (`233.6` Avg / `413.0` Top 30% / `568.5` Top 10%), 7 ranked weakness priorities, M1–M4 competency & trend charts, streak tracking, and anti-easy-MCQ daily recommendations. |
| 3 | `/guide` | **Tutorial & Exam Guide** (`TutorialGuidePage.tsx`) | Persistent 6-step onboarding checklist + 4 interactive tabs: *Using the IBT Simulators*, *2026 Blueprint & 150-Min Pacing*, *Coding/SQL/PDF Labs*, and the *197 → 450+ Level 3 Playbook*. |
| 4 | `/study-library` | **Study Library** (`StudyLibraryPage.tsx`) | Structured M1–M4 lessons, worked TOPCIT examples, searchable technical glossary, official TOPCIT/CHED reference links, and PDF-imported study notes. |
| 5 | `/practice` | **Practice Questions** (`PracticeHubPage.tsx`) | 78 verified original items (75-item 2026 Mock Set #1 + 3 targeted M3 security drills) across 6 modes (Guided, Weakness Training, Timed Section, Performance Bootcamp, Mistake Review, Random). Includes **3-step non-spoiler progressive hints** and **Guided Answer Outlines** in untimed modes. |
| 6 | `/mock-exam` | **Full Mock Exam (75Q IBT)** (`MockExamPage.tsx`) | Distraction-free 75-item, 150-minute CBT simulator with pre-launch blueprint verification, wall-clock reload-surviving timer, Dexie autosave, collapsible type-filtered navigator (`MCQ / Desc / Perf / Int`), rich SVG/table exhibits (`QuestionStemRenderer`), embedded Monaco + Pyodide/`sql.js` workspace, embedded Diagram Studio, 3-tab 80-pt Integrated workspaces, keyboard shortcuts, and strict pre-submission zero-leakage. |
| 7 | `/diagram-lab` | **Diagram Studio (8 IBT Editors)** (`DiagramLabPage.tsx`) | Crisp **light-mode TOPCIT IBT** React Flow studio for all **8 diagram types**: Activity, Class, Component, ER Diagram (ERD), Flowchart, Sequence, UI Wireframe, and Use Case. Features dual engineering graph-paper gridlines, 2-column visual SVG shape palette, compact single-row editing toolbar, tabbed `Text / Style / Arrange` inspector, undo/redo, layout-independent structural validator, **Hint & Guide + 100%-passing Worked Examples**, Dexie persistence, and SVG/PNG/JSON export. |
| 8 | `/coding-lab` | **Compiler & SQL Lab** (`CodingLabPage.tsx`) | **Compiler Tab**: Monaco Editor + in-browser **Python 3 (Pyodide Web Worker)** with background pre-warming, 2-stage timeout (45s cold-boot download / 6s loop guard), **Python 101 Warm-Ups**, hidden test privacy, and optional Docker C/C++/Java sandbox. **SQL Tab**: deterministic in-browser **`sql.js` SQLite WASM** runner, **SQL 101 Interactive Sandbox (5 lessons)**, **Peek Rows** table inspector, result-set equivalence grading, and Fill-in-the-Blank / Commented Worked Examples. |
| 9 | `/integrated` | **Integrated Challenges (80 pts)** (`IntegratedChallengesPage.tsx`) | Cross-domain 80-point M1–M3 workplace scenarios combining written architecture design, embedded interactive Diagram Canvas, code/SQL scratchpad, plain-English situation coach, 1-click **Fill-in-the-Blank Outline**, and partial-credit rubric self-assessment. |
| 10 | `/ai-tutor` | **AI Tutor** (`AiTutorPage.tsx`) | Interactive 2026 syllabus tutor & AI draft question generator backed by **Google Gemini (`gemini-3.8-flash` with automatic Flash model fallback)** via server-side proxy/Netlify Function, plus a zero-key local deterministic syllabus fallback and Draft Review Queue. |
| 11 | `/mistakes` | **Mistake Review** (`MistakeReviewPage.tsx`) | Spaced-repetition review queue grouped by 7 error-cause categories (conceptual gap, misread prompt, SQL/syntax bug, diagram notation, security oversight, pacing/blank, careless error) with targeted remediation prescriptions. |
| 12 | `/analytics` | **Results & Analytics** (`AnalyticsPage.tsx`) | Weighted 1,000-point score vs raw accuracy, transparent Pending Evaluation separation, M1–M4 stacked & radar charts, one-click post-exam SQL/Python/Diagram auto-graders, optional AI descriptive rubric estimates, and print/PDF export. |
| 13 | `/planner` | **Study Planner** (`StudyPlannerPage.tsx`) | Adaptive daily study queue and 19-topic SM-2 spaced repetition mastery matrix prioritized by 2026 point leverage. |
| 14 | `/settings` | **Settings & Sources** (`SettingsPage.tsx`) | Target score & descriptive character-limit presets (450 Korean ref / 1,500 English / custom), reconciled 2025 score report import with side-by-side image preview, local `pdfjs-dist` PDF uploader with page provenance, and Zod-validated JSON backup/restore. |

---

## Architecture & Tech Stack

- **Frontend:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, React Router 7, Zustand, TanStack Query, Recharts, Lucide Icons, Radix UI primitives
- **Interactive Simulators:** `@xyflow/react` v13 (light-mode IBT Diagram Studio), `@monaco-editor/react` (code/SQL editor), **Pyodide Web Worker** (Python 3 WASM), **`sql.js`** (SQLite WASM), **`pdfjs-dist`** (local PDF parsing)
- **Persistence & Offline:** Dexie 4 (IndexedDB), Zod runtime schema validation, `vite-plugin-pwa` (Workbox Service Worker)
- **AI Backend:** Netlify Functions v2 (`netlify/functions/ai.mjs`) & local Node proxy (`server/api/index.mjs`) using `gemini-3.8-flash` with automatic `404` fallback (`gemini-flash-latest`, `gemini-3.5-flash-lite`)
- **Testing:** Vitest + Testing Library + `fake-indexeddb` (13 test files / 35 tests) & Playwright E2E (4 critical flow specs)

### Repository Structure

```text
├── netlify/functions/
│   └── ai.mjs                      # Serverless Netlify Function v2 (/api/ai/*) for Gemini Flash
├── server/
│   ├── api/index.mjs               # Optional local Node AI proxy (auto-loads .env, port 8788)
│   └── sandbox-runner/index.mjs    # Optional hardened Docker runner for C / C++ / Java (port 8787)
├── src/
│   ├── App.tsx                     # Router for all 14 screens + IndexedDB bootstrap
│   ├── components/
│   │   ├── exam/                   # CBTExamRunner, EmbeddedExamCodeWorkspace, QuestionStemRenderer
│   │   ├── labs/                   # DiagramWorkspace, DiagramNodeRenderer, PaletteShapeIcon
│   │   ├── layout/                 # AppShell (sidebar + Guided Tour trigger), ErrorBoundary
│   │   ├── shared/                 # GuidedTourModal (7 stops), HintCoachDrawer (3-step hints)
│   │   ├── charts/                 # Recharts M1–M4 domain & progression charts
│   │   └── ui/                     # Reusable academic UI primitives
│   ├── data/
│   │   ├── questions/              # 75-item 2026 Mock Set #1 (m1..m4) + 3 M3 security drills
│   │   ├── labChallenges.ts        # Coding & SQL performance lab challenges
│   │   ├── learningGuides.ts       # Plain-English coaches, SQL/Python 101, 8 worked diagrams
│   │   └── lessons_seed.ts         # M1–M4 study library lessons & glossary
│   ├── db/                         # Dexie schema, seeder, backup/restore, useLiveQuery
│   ├── domain/                     # Blueprint 2026, Syllabus, Scoring, Learning (SM-2), Diagram specs
│   ├── lib/                        # codeRunner (2-stage Pyodide), sqlRunner, aiTutorClient, pdfIngestor
│   ├── pages/                      # All 14 application screens
│   ├── stores/                     # Zustand app & Guided Tour state
│   ├── workers/                    # pyodide.worker.ts (isolated Web Worker)
│   └── __tests__/                  # 13 Vitest unit & integration test suites
├── e2e/critical.spec.ts            # Playwright end-to-end verification suite
├── netlify.toml                    # Netlify build, WASM/PWA headers, SPA fallback
└── .env.example                    # Server-side environment variable template
```

---

## Quick Start (Local Development)

Requires **Node.js 20+** and **pnpm 10+**.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Core offline study, 75-item mock exam, all 8 diagram studios, Python 3 (Pyodide), SQL (`sql.js`), hints, guided tour, and PDF ingestion work immediately with **zero API keys**.

### Optional: Enable Live Gemini AI Tutor Locally
1. Create a local `.env` file in the project root (gitignored — **never** prefix `GEMINI_API_KEY` with `VITE_`):
   ```env
   GEMINI_API_KEY=your_google_ai_or_vertex_key
   GEMINI_MODEL=gemini-3.8-flash
   GEMINI_DAILY_REQUEST_LIMIT=50
   ```
2. Create a local `.env.local` file pointing Vite to the local proxy:
   ```env
   VITE_AI_API_BASE=http://localhost:8788
   ```
3. Start the local AI proxy in a second terminal (`server/api/index.mjs` automatically reads `.env`):
   ```bash
   node server/api/index.mjs
   ```

### Optional: Local Docker Sandbox (C, C++, Java)
Never executes submitted user code on the host OS. Runs inside ephemeral containers (`--network=none --memory=128m --cpus=0.5 --pids-limit=64 --read-only`, 5s timeout):
```bash
node server/sandbox-runner/index.mjs
```
Requires Docker Engine running locally with `gcc:13-bookworm` and `eclipse-temurin:17-jdk-alpine`.

---

## Deploying to Netlify

This repository is pre-configured with [netlify.toml](netlify.toml), Corepack `packageManager`, WASM/PWA headers, SPA routing fallback, and the serverless AI handler at [netlify/functions/ai.mjs](netlify/functions/ai.mjs).

1. Import `katto-1204/precit-2026` in **Netlify → Add new site → Import an existing project**.
2. Netlify auto-reads `netlify.toml` (`build = "pnpm build"`, `publish = "dist"`, `functions = "netlify/functions"`).
3. *(Optional)* Add **`GEMINI_API_KEY`** under **Project configuration → Environment variables** (Scope: Functions) and trigger a deploy. Without it, the AI Tutor gracefully uses its built-in local 2026 syllabus engine.

---

## Verification & Testing

```bash
pnpm typecheck   # TypeScript strict check (tsc --noEmit)
pnpm test        # 13 Vitest suites / 35 unit & integration tests (incl. all 8 worked diagrams = 50/50)
pnpm build       # Production tsc -b + Vite bundle + PWA Service Worker
pnpm test:e2e    # 4 Playwright end-to-end specs (Landing, 75Q Exam, Diagram Lab, SQL Lab + Guided Tour)
```

---

## Known Limitations
- **C, C++, and Java execution** requires starting the optional local Docker sandbox (`server/sandbox-runner/index.mjs`); Python 3 and SQLite run natively in the browser.
- **First-run Python execution (Pyodide)** downloads the WebAssembly runtime from jsDelivr once (~10s, pre-warmed automatically on opening Compiler Lab and cached by the browser thereafter).
- **Scanned image-only PDFs** without an embedded text layer show a minimal-text warning rather than guessing missing text.
