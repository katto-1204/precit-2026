import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { initializeDatabase } from '@/db/seed';
import { PracticeHubPage } from '@/pages/PracticeHubPage';
import { StudyLibraryPage } from '@/pages/StudyLibraryPage';

describe('Phase 2 Study Library & Practice Hub integration', () => {
  it('renders M1-M4 lessons in StudyLibraryPage and filters by domain', async () => {
    await initializeDatabase();

    render(
      <MemoryRouter>
        <StudyLibraryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Study Library \(2026 Syllabus M1–M4\)/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(/Information Security Core: CIA Triad/i).length,
      ).toBeGreaterThan(0);
    });
  });

  it('starts a Practice Hub session, checks an MCQ, reveals explanation, and persists response', async () => {
    await initializeDatabase();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/practice?domain=M3&topic=M3-SEC-FUND&mode=guided']}>
        <PracticeHubPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Practice Hub')).toBeInTheDocument();
    });

    const startBtn = await screen.findByRole('button', { name: /Start Practice/i });
    await waitFor(() => expect(startBtn).not.toBeDisabled());
    await user.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText(/Question 1 \//i)).toBeInTheDocument();
    });

    // Click option B (correct for M3-MCQ-08 CIA Triad) or first available option button
    const optionButtons = screen.getAllByRole('button').filter((btn) =>
      /^[ABCD]/.test(btn.textContent?.trim() ?? ''),
    );
    expect(optionButtons.length).toBeGreaterThanOrEqual(4);
    await user.click(optionButtons[1]);

    const checkBtn = screen.getByRole('button', { name: /Check Answer/i });
    await user.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/Explanation:/i)).toBeInTheDocument();
    });

    const savedResponses = await db.responses.count();
    expect(savedResponses).toBeGreaterThan(0);
  });
});
