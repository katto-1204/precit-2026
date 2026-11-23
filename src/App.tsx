import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { initializeDatabase } from '@/db/seed';
import { AiTutorPage } from '@/pages/AiTutorPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { CodingLabPage } from '@/pages/CodingLabPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiagramLabPage } from '@/pages/DiagramLabPage';
import { IntegratedChallengesPage } from '@/pages/IntegratedChallengesPage';
import { MistakeReviewPage } from '@/pages/MistakeReviewPage';
import { MockExamPage } from '@/pages/MockExamPage';
import { PracticeHubPage } from '@/pages/PracticeHubPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StudyLibraryPage } from '@/pages/StudyLibraryPage';
import { StudyPlannerPage } from '@/pages/StudyPlannerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/study-library" element={<StudyLibraryPage />} />
        <Route path="/practice" element={<PracticeHubPage />} />
        <Route path="/mock-exam" element={<MockExamPage />} />
        <Route path="/coding-lab" element={<CodingLabPage />} />
        <Route path="/diagram-lab" element={<DiagramLabPage />} />
        <Route path="/integrated" element={<IntegratedChallengesPage />} />
        <Route path="/ai-tutor" element={<AiTutorPage />} />
        <Route path="/mistakes" element={<MistakeReviewPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/planner" element={<StudyPlannerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[PrepCIT] Database initialization failed:', err);
        setInitError(err instanceof Error ? err.message : 'Failed to initialize local database.');
      });
  }, []);

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6">
          <h1 className="text-base font-semibold text-red-700">Local Database Initialization Error</h1>
          <p className="mt-2 text-xs text-slate-600">{initError}</p>
        </div>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <p className="text-xs font-medium text-slate-500">
            Initializing local PrepCIT workspace &amp; verified 2025 baseline...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
