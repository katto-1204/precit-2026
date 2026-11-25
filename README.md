# PrepCIT — Unofficial 2026 TOPCIT Exam Simulator & Personalized Learning Platform

> **Disclaimer**: PrepCIT is an **unofficial**, independent study and examination simulation platform built for BSIT students preparing for the revised **2026 TOPCIT** examination. It is not affiliated with IITP or TOPCIT, does not redistribute proprietary exam banks, and clearly distinguishes original practice items and AI-assisted estimates from official TOPCIT scoring.

## Quick Start

Requires **Node.js 20+** and **pnpm 10+**. Core offline study, 75-item CBT mock exam, 8 interactive diagram editors, Python (Pyodide), SQL (`sql.js`), and PDF ingestion work with **zero API keys**.

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

## Deploy to Netlify

This repository includes [netlify.toml](netlify.toml), Corepack `packageManager` config, SPA fallback routing, WASM/PWA headers, and a serverless Gemini function at `netlify/functions/ai.mjs`.

1. Push to GitHub and open **Netlify → Add new site → Import an existing project**.
2. Select your repository (`katto-1204/precit-2026`). Netlify automatically detects:
   - **Build command**: `pnpm build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
3. *(Optional)* To enable live Gemini Flash AI tutoring & descriptive rubric estimates on Netlify, add **`GEMINI_API_KEY`** under **Site configuration → Environment variables** (see `.env.example`). Without it, PrepCIT still works 100% locally with zero errors via offline syllabus fallback.

## Optional Local Backend Services

### 1. Isolated Docker Sandbox Runner (C, C++, Java)
Never runs submitted user code on the host OS. Executes inside ephemeral Docker containers with `--network=none --memory=128m --cpus=0.5 --pids-limit=64 --read-only` and a 5-second hard timeout.
```bash
node server/sandbox-runner/index.mjs
```
Requires Docker Desktop / Engine running locally with `gcc:13-bookworm` and `eclipse-temurin:17-jdk-alpine` images.

### 2. Google Gemini API Backend Proxy (Free-Tier Flash-First)
Keeps `GEMINI_API_KEY` strictly on the server (never in frontend bundles) with response caching, exponential backoff, and a daily request budget cap.
```powershell
$env:GEMINI_API_KEY="your_key_here"
$env:GEMINI_MODEL="gemini-2.5-flash"
$env:GEMINI_DAILY_REQUEST_LIMIT="50"
node server/api/index.mjs
```
When not running or when quota is exhausted, the AI Tutor automatically falls back to deterministic local 2026 syllabus retrieval.

## Verified 2026 TOPCIT Blueprint Alignment

Effective **May 16, 2026** (75 questions · 1,000 points · 150 minutes · 4 domains):

| Domain | MCQ (5) | Descriptive (30) | Std Perf (50) | Int Perf (80) | Total Q | Total Pts |
|---|---:|---:|---:|---:|---:|---:|
| **M1 — Software Development** | 15 | 2 | 3 | 1 | **21** | **365** |
| **M2 — Data Management** | 15 | 2 | 1 | 1 | **19** | **265** |
| **M3 — Systems Architecture & InfoSec** | 15 | 1 | 1 | 1 | **18** | **235** |
| **M4 — IT Business** | 15 | 2 | 0 | 0 | **17** | **135** |
| **Total** | **60 (300)** | **7 (210)** | **5 (250)** | **3 (240)** | **75** | **1,000** |

## Implemented Platform Modules (12-Section Workspace)

1. **Dashboard** (`/`): Verified Dec 10, 2025 historical baseline (`197/1000`, `25/65`, Level 2), benchmark references (`233.6` Avg / `413.0` Top 30% / `568.5` Top 10%), 7 prioritized weaknesses, M1–M4 competency chart, score progression trend, study streak, and anti-easy-MCQ recommendations.
2. **Study Library** (`/study-library`): M1–M4 structured lessons, worked TOPCIT examples, searchable glossary, official TOPCIT & CHED foundational reviewer links, and PDF-imported lessons.
3. **Practice Questions** (`/practice`): 78 verified original items (full 75-item Mock Set #1 + 3 targeted security drills) across Guided, Weakness Training, Timed Section, Performance Bootcamp, Mistake Review, and Random modes.
4. **Full Mock Exam** (`/mock-exam`): Distraction-free 75-item, 150-minute CBT simulator with pre-launch blueprint verification, wall-clock reload-surviving timer, Dexie autosave, resizable split panels, embedded interactive Diagram Canvas, keyboard shortcuts, and strict pre-submission zero-leak protection.
5. **Diagram Laboratory** (`/diagram-lab`): All **8 interactive React Flow editors** (Activity, Class, Component, ERD, Flowchart, Sequence, UI Wireframe, Use Case) with context-sensitive drag/drop shape palettes, horizontal editing toolbar, collapsible right properties inspector, undo/redo, layout-independent structural rubric evaluation, Dexie save/load, and JSON/SVG/PNG export.
6. **Compiler & SQL Laboratory** (`/coding-lab`): Monaco Editor + isolated Pyodide Web Worker Python runner (with hard timeout termination), optional Docker sandbox for C/C++/Java, debugging challenges, hidden test privacy, and in-browser `sql.js` SQLite WASM query runner with result-set equivalence grading.
7. **Integrated Challenges** (`/integrated`): Multi-artifact 80-point workplace scenarios across M1–M3 combining written design, embedded Diagram Canvas, code/SQL scratchpad, and 80-point partial-credit rubrics.
8. **AI Tutor** (`/ai-tutor`): Gemini Flash backend integration with strict cost controls + zero-key offline curriculum fallback.
9. **Mistake Review** (`/mistakes`): Spaced-repetition mistake queue grouped by 7 error-cause categories with concrete next-exercise prescriptions.
10. **Results & Analytics** (`/analytics`): Weighted 1,000-point score vs raw item accuracy, pending-evaluation separation, M1–M4 stacked & radar charts, live post-exam rubric self-grading, and print/PDF report export.
11. **Study Planner** (`/planner`): Adaptive daily queue and 19-topic SM-2 spaced repetition mastery matrix.
12. **Settings & Sources** (`/settings`): Target score & descriptive limit presets (450 Korean ref / 1,500 English / custom), reconciled 2025 historical score import, local `pdfjs-dist` PDF uploader with page provenance, and Zod-validated JSON backup/restore.

## Known Limitations
- **C, C++, and Java execution** requires starting the optional local Docker sandbox (`server/sandbox-runner/index.mjs`); Python 3 and SQL run natively in the browser.
- **First-run Python execution (Pyodide)** downloads the Pyodide WebAssembly runtime from jsDelivr once while online (cached thereafter by the browser).
- **Scanned image-only PDFs** without an embedded text layer report a minimal-text warning so the user can manually verify fields rather than guessing missing text.
