import { create } from 'zustand';
import type { DomainId } from '@/domain/blueprint2026';

interface AppState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  selectedDomainFilter: DomainId | 'ALL';
  tourOpen: boolean;
  tourStep: number;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setSelectedDomainFilter: (domain: DomainId | 'ALL') => void;
  startTour: (step?: number) => void;
  closeTour: () => void;
  setTourStep: (step: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  selectedDomainFilter: 'ALL',
  tourOpen: false,
  tourStep: 0,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSelectedDomainFilter: (domain) => set({ selectedDomainFilter: domain }),
  startTour: (step = 0) => set({ tourOpen: true, tourStep: step }),
  closeTour: () => {
    try {
      window.localStorage.setItem('prepcit_tour_seen_v1', '1');
    } catch {
      // ignore storage errors
    }
    set({ tourOpen: false });
  },
  setTourStep: (step) => set({ tourStep: step }),
}));
