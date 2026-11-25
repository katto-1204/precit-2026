import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardCheck,
  Code2,
  Compass,
  Flame,
  GitBranch,
  LayoutDashboard,
  Menu,
  RotateCcw,
  Settings,
  ShieldAlert,
  Target,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { GuidedTourModal } from '@/components/shared/GuidedTourModal';
import { BLUEPRINT_2026, getCompetencyLevel } from '@/domain/blueprint2026';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/guide', label: 'Tutorial & Guide', icon: Compass, badge: 'Start' },
  { to: '/study-library', label: 'Study Library', icon: BookOpen },
  { to: '/practice', label: 'Practice Questions', icon: Target },
  { to: '/mock-exam', label: 'Full Mock Exam', icon: ClipboardCheck, badge: '75Q' },
  { to: '/diagram-lab', label: 'Diagram Lab', icon: GitBranch, badge: '8' },
  { to: '/coding-lab', label: 'Compiler & SQL Lab', icon: Code2 },
  { to: '/integrated', label: 'Integrated Challenges', icon: Flame, badge: '80p' },
  { to: '/ai-tutor', label: 'AI Tutor', icon: Bot },
  { to: '/mistakes', label: 'Mistake Review', icon: RotateCcw },
  { to: '/analytics', label: 'Results & Analytics', icon: BarChart3 },
  { to: '/planner', label: 'Study Planner', icon: CalendarDays },
  { to: '/settings', label: 'Settings & Sources', icon: Settings },
];

export function AppShell() {
  const location = useLocation();
  const { mobileNavOpen, setMobileNavOpen, startTour } = useAppStore();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const profile = useLiveQuery(() => db.profiles.get('primary'), []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  const targetScore = profile?.targetScore ?? 450;
  const targetLevel = getCompetencyLevel(targetScore);

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <NavLink to="/" className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 hover:bg-slate-50/80 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 font-mono text-sm font-bold text-white">
            PC
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-900">PrepCIT</span>
              <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-700">
                2026
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-500">TOPCIT-Style Simulator</p>
          </div>
        </NavLink>

        <nav aria-label="Primary Navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Target Score</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {targetScore}/1000
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-brand-700">{targetLevel.label}</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Blueprint: {BLUEPRINT_2026.totalQuestions}Q · {BLUEPRINT_2026.durationMinutes}m · Eff.{' '}
              {BLUEPRINT_2026.effectiveDate}
            </p>
          </div>

          <div className="flex items-start gap-2 text-[11px] leading-4 text-slate-500">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Unofficial practice platform. Not affiliated with IITP/TOPCIT; original practice items only.
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <span className="text-sm font-bold text-slate-900">PrepCIT 2026</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav aria-label="Mobile Navigation" className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium text-slate-500">
              Revised 2026 TOPCIT Blueprint{' '}
              <span className="hidden sm:inline text-slate-400">
                (75 Questions · 1,000 Points · 150 Minutes · M1–M4)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => startTour(0)}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Guided Tour</span>
            </button>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800',
              )}
            >
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isOnline ? 'Local DB Ready' : 'Offline Study Mode'}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <GuidedTourModal />
    </div>
  );
}
