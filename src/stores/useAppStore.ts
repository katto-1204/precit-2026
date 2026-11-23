import { create } from 'zustand';
import type { DomainId } from '@/domain/blueprint2026';

interface AppState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  selectedDomainFilter: DomainId | 'ALL';
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setSelectedDomainFilter: (domain: DomainId | 'ALL') => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  selectedDomainFilter: 'ALL',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSelectedDomainFilter: (domain) => set({ selectedDomainFilter: domain }),
}));
