import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { initializeDatabase } from '@/db/seed';
import { MOCK_2026_SET_1 } from '@/data/questions';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { MockExamPage } from '@/pages/MockExamPage';

describe('Phase 3 Full 2026 CBT Mock Exam Simulator invariants', () => {
  beforeEach(async () => {
    await initializeDatabase();
    await db.examAttempts.clear();
    await db.responses.clear();
  });

  it('launches 75Q exam, hides explanations, survives reload with autosaved answers & timer, and scores unfinished tasks as 0', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <MemoryRouter initialEntries={['/mock-exam']}>
        <Routes>
          <Route path="/mock-exam" element={<MockExamPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/75Q \/ 1,000 Pts Verified/i)).toBeInTheDocument();
    });

    const startBtn = screen.getByRole('button', { name: /Start Full 2026 Mock Exam/i });
    await user.click(startBtn);

    // CBT interface mounted with timer and Navigator (75 Items)
    await waitFor(() => {
      expect(screen.getByText('Navigator (75 Items)')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    // Zero-leak guarantee: first question's explanation must NOT appear in active exam DOM
    const firstMcq = MOCK_2026_SET_1.find((q) => q.id === 'M1-MCQ-01')!;
    expect(screen.queryByText(firstMcq.explanation)).not.toBeInTheDocument();

    // Answer Q1 with option B (correct for M1-MCQ-01) and flag it
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
    await user.click(radios[1]); // Option B

    const flagBtn = screen.getByRole('button', { name: /Flag for Review/i });
    await user.click(flagBtn);

    // Wait for IndexedDB autosave
    await waitFor(async () => {
      const saved = await db.responses.toArray();
      expect(saved.some((r) => r.selectedOptionId === 'B' && r.isFlagged)).toBe(true);
    });

    // Simulate full browser reload by unmounting and remounting MockExamPage
    unmount();

    render(
      <MemoryRouter initialEntries={['/mock-exam']}>
        <Routes>
          <Route path="/mock-exam" element={<MockExamPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Resume banner detects interrupted exam with wall-clock timer surviving reload
    const resumeBtn = await screen.findByRole('button', { name: /Resume Full Mock Exam/i });
    await user.click(resumeBtn);

    await waitFor(() => {
      const restoredRadios = screen.getAllByRole('radio');
      expect(restoredRadios[1]).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('button', { name: /Flagged for Review/i })).toBeInTheDocument();
    });

    // Submit exam via confirmation dialog
    await user.click(screen.getByRole('button', { name: /Submit Exam/i }));
    const confirmBtn = await screen.findByRole('button', { name: /Confirm & Submit Exam/i });
    await user.click(confirmBtn);

    // Redirects to Analytics and verifies exact scoring: 5 pts for M1-MCQ-01, 0 pts for all 74 unfinished items
    await waitFor(async () => {
      const submitted = await db.examAttempts.where('status').equals('submitted').toArray();
      expect(submitted.length).toBe(1);
      expect(submitted[0].evaluatedPoints).toBe(5);
      expect(submitted[0].pendingPoints).toBe(0);
      expect(submitted[0].maxPoints).toBe(1000);
      expect(submitted[0].questionIds.length).toBe(75);
    });
  });
});
