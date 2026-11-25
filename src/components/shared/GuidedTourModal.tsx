import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Code2,
  Compass,
  Flame,
  GitBranch,
  LayoutDashboard,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';

interface TourStepDef {
  id: string;
  route: string;
  badge: string;
  title: string;
  reassurance: string;
  body: string;
  tryThis: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOUR_STEPS: readonly TourStepDef[] = [
  {
    id: 'dashboard',
    route: '/dashboard',
    badge: 'Step 1 of 7 · Start Here',
    title: 'Welcome to PrepCIT — Take a Deep Breath!',
    reassurance: 'You do NOT need to master all 12 screens today.',
    body: 'Your Dashboard tracks your verified 197/1000 baseline and shows your #1 high-leverage areas to reach 450+ (Level 3). Think of this page as your calm home base.',
    tryThis: 'Ignore the full 75-question exam at first. Follow the green/red priority cards one topic at a time.',
    icon: LayoutDashboard,
  },
  {
    id: 'study',
    route: '/study-library',
    badge: 'Step 2 of 7 · Learn First',
    title: 'Study Library: Plain-English Concepts Before Tests',
    reassurance: 'Read short summaries before ever taking a quiz.',
    body: 'Every 2026 domain (M1 Software Dev, M2 Data/SQL, M3 Systems & Security, M4 IT Business) has bite-sized lessons, exam tips, and a glossary explaining intimidating jargon.',
    tryThis: 'Pick ONE weak topic (like M3 Information Security or M2 SQL) and read for 5 minutes.',
    icon: BookOpen,
  },
  {
    id: 'practice',
    route: '/practice',
    badge: 'Step 3 of 7 · Safe Practice',
    title: 'Practice Questions — Now with 3-Step Hints!',
    reassurance: 'No timer, no penalty, unlimited retries.',
    body: 'In Guided Practice, every question has a "What Does This Mean? & Progressive Hints" drawer. Reveal Hint 1, 2, or 3 one step at a time before checking your answer.',
    tryThis: 'Start a short 5-question Guided session and open the blue Hint Coach whenever a prompt sounds confusing.',
    icon: Target,
  },
  {
    id: 'coding',
    route: '/coding-lab',
    badge: 'Step 4 of 7 · SQL & Coding Sandbox',
    title: 'SQL & Coding Lab — Ready-Made 101 Warm-Ups!',
    reassurance: 'Nothing breaks here — run experiments freely.',
    body: 'Switch to the "SQL & Database Lab" tab to try 1-click SQL 101 tutorials (SELECT, JOIN, GROUP BY, LEFT JOIN), peek at live table rows, and use "Load Fill-in-the-Blank Practice" or "Load Worked Example".',
    tryThis: 'In the SQL tab, click any SQL 101 Warm-Up button and press Execute SQL to watch real SQLite tables respond!',
    icon: Code2,
  },
  {
    id: 'diagram',
    route: '/diagram-lab',
    badge: 'Step 5 of 7 · Visual IBT Diagrams',
    title: 'Diagram Studio — Load Ready-Made Examples First!',
    reassurance: 'You never have to stare at a blank white grid.',
    body: 'Click "Guided" on any of the 8 TOPCIT diagram types, then open "Hint & Guide" inside the editor. You can load a 100%-passing Worked Example to study how real diagrams look!',
    tryThis: 'Open Activity Diagram or ER Diagram → click "Hint & Guide" → click "Load Ready-Made Example (100%)" and hit Validate.',
    icon: GitBranch,
  },
  {
    id: 'integrated',
    route: '/integrated',
    badge: 'Step 6 of 7 · Taming 80-Pt Scenarios',
    title: 'Integrated Challenges — Turn 80 Points into 3 Easy Parts',
    reassurance: 'Partial credit is your secret weapon to jump from 197 to 450+.',
    body: 'Every 80-point scenario now includes a plain-English story breakdown, 3 deliverable hints, and a 1-click "Load Guided Fill-in-the-Blank Outline" button so you never start from scratch.',
    tryThis: 'Open the Hint Coach on any 80-pt challenge and click "Load Guided Fill-in-the-Blank Outline".',
    icon: Flame,
  },
  {
    id: 'mock',
    route: '/mock-exam',
    badge: 'Step 7 of 7 · Exam Day Dress Rehearsal',
    title: 'Full Mock Exam — Save This for When You Feel Ready!',
    reassurance: 'Hints turn OFF here so it feels like the real May 16, 2026 IBT exam.',
    body: 'When you have practiced the labs and feel comfortable, run the 75-question, 150-minute simulator. Everything auto-saves locally so you can pause or resume anytime.',
    tryThis: 'You can replay this Guided Tour anytime from the "Guided Tour" button in the top bar!',
    icon: ClipboardCheck,
  },
];

export function GuidedTourModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourOpen, tourStep, closeTour, setTourStep } = useAppStore();

  const safeIndex = Math.max(0, Math.min(TOUR_STEPS.length - 1, tourStep));
  const step = TOUR_STEPS[safeIndex];
  const Icon = step.icon;

  // Automatically navigate to the current tour stop's real page so the user sees it live!
  useEffect(() => {
    if (!tourOpen) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [tourOpen, step.route, location.pathname, navigate]);

  // Allow Escape key to close tour cleanly
  useEffect(() => {
    if (!tourOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tourOpen, closeTour]);

  if (!tourOpen) return null;

  const isFirst = safeIndex === 0;
  const isLast = safeIndex === TOUR_STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="PrepCIT Interactive Guided Tour"
      className="fixed top-16 right-4 left-4 z-50 mx-auto max-h-[calc(100vh-5.5rem)] max-w-lg overflow-y-auto rounded-xl border-2 border-brand-600 bg-white shadow-2xl sm:left-auto sm:right-6"
    >
      {/* Top accent strip */}
      <div className="flex items-center justify-between gap-2 rounded-t-[10px] border-b border-slate-200 bg-brand-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
            <Compass className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold text-brand-800">Interactive Guided Tour</span>
          <Badge variant="brand" className="font-mono text-[10px]">
            {safeIndex + 1} / {TOUR_STEPS.length}
          </Badge>
        </div>
        <button
          type="button"
          aria-label="Close guided tour"
          onClick={closeTour}
          className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-slate-800 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-700">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {step.badge}
            </p>
            <h2 className="mt-0.5 text-sm font-bold text-slate-900">{step.title}</h2>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">{step.reassurance}</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-700">{step.body}</p>

        <div className="rounded-md border border-sky-200 bg-sky-50/70 px-3 py-2 text-xs text-sky-950">
          <span className="inline-flex items-center gap-1 font-bold text-sky-800">
            <Sparkles className="h-3.5 w-3.5" />
            Try This Here:
          </span>{' '}
          {step.tryThis}
        </div>

        {/* Clickable step dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Jump to tour step ${idx + 1}: ${s.title}`}
              onClick={() => setTourStep(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === safeIndex
                  ? 'w-6 bg-brand-600'
                  : idx < safeIndex
                    ? 'w-2 bg-brand-300'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={isFirst}
            onClick={() => setTourStep(safeIndex - 1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={closeTour}>
              Skip Tour
            </Button>
            {isLast ? (
              <Button
                size="sm"
                onClick={() => {
                  closeTour();
                  navigate('/coding-lab');
                }}
              >
                Finish &amp; Try Labs
              </Button>
            ) : (
              <Button size="sm" onClick={() => setTourStep(safeIndex + 1)}>
                Next Stop
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
