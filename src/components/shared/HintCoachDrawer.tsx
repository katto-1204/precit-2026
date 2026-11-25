import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GlossaryChip, ProgressiveHint } from '@/data/learningGuides';

export interface HintCoachAction {
  label: string;
  onClick: () => void;
  variant?: 'outline' | 'primary' | 'ghost';
}

interface HintCoachDrawerProps {
  /** Unique key (e.g., question/challenge id) so unlocked hints reset cleanly when switching items */
  itemKey?: string;
  title?: string;
  situationPlainEnglish: string;
  extraNote?: string;
  glossary?: GlossaryChip[];
  hints: ProgressiveHint[];
  actions?: HintCoachAction[];
  defaultOpen?: boolean;
  compact?: boolean;
}

export function HintCoachDrawer({
  itemKey,
  title = 'What Does This Mean? & Progressive Hints',
  situationPlainEnglish,
  extraNote,
  glossary = [],
  hints,
  actions = [],
  defaultOpen = false,
  compact = false,
}: HintCoachDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastKey, setLastKey] = useState(itemKey);

  // Reset revealed hints cleanly when switching to a new question/challenge
  if (itemKey !== lastKey) {
    setLastKey(itemKey);
    setRevealedCount(0);
  }

  const nextHint = hints[revealedCount];

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 text-left transition-colors hover:bg-sky-100/50 cursor-pointer ${
          compact ? 'px-3 py-2' : 'px-4 py-2.5'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-600 text-white">
            <Lightbulb className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">{title}</span>
              <Badge variant="info" className="text-[10px]">
                {revealedCount}/{hints.length} Hints Opened
              </Badge>
            </div>
            {!open ? (
              <p className="truncate text-[11px] text-slate-600">
                Feeling stuck or intimidated? Click here for a plain-English breakdown &amp; step-by-step hints.
              </p>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 text-slate-500">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open ? (
        <div className={`space-y-3 border-t border-sky-200/80 ${compact ? 'p-3' : 'p-4'} text-xs`}>
          {/* Plain-English Situation Breakdown */}
          <div className="rounded-md border border-white bg-white p-3 shadow-2xs">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
              <HelpCircle className="h-3.5 w-3.5" />
              What Is This Situation Actually Asking?
            </div>
            <p className="leading-relaxed text-slate-700">{situationPlainEnglish}</p>
            {extraNote ? (
              <p className="mt-2 whitespace-pre-line rounded bg-slate-50 p-2 font-mono text-[11px] text-slate-700 border border-slate-200">
                {extraNote}
              </p>
            ) : null}
          </div>

          {/* Mini Plain-English Glossary */}
          {glossary.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                <BookOpen className="h-3.5 w-3.5 text-sky-700" />
                What Do These Terms Mean?
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {glossary.map((g) => (
                  <div
                    key={g.term}
                    className="rounded border border-slate-200 bg-white px-2.5 py-2 text-[11px]"
                  >
                    <span className="font-mono font-bold text-slate-900">{g.term}: </span>
                    <span className="text-slate-600">{g.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Progressive Revealed Hints */}
          {revealedCount > 0 ? (
            <div className="space-y-2">
              {hints.slice(0, revealedCount).map((h) => (
                <div
                  key={h.level}
                  className="rounded-md border border-amber-200 bg-amber-50/90 p-3 text-slate-800"
                >
                  <p className="font-semibold text-amber-950">{h.title}</p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-amber-900/90">
                    {h.body}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Controls: Unlock Next Hint + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {nextHint ? (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                onClick={() => setRevealedCount((c) => Math.min(hints.length, c + 1))}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Reveal {nextHint.title.split('—')[0].trim()} ({revealedCount + 1}/{hints.length})
              </Button>
            ) : (
              <span className="text-[11px] font-medium text-emerald-700">
                All {hints.length} hints unlocked — you’ve got this!
              </span>
            )}

            {actions.map((act) => (
              <Button
                key={act.label}
                size="sm"
                variant={act.variant ?? 'outline'}
                className="bg-white"
                onClick={act.onClick}
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                {act.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
