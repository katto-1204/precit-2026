import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '@/db/seed';
import { DashboardPage } from '@/pages/DashboardPage';

describe('DashboardPage integration', () => {
  it('renders verified 2025 baseline, target score, 7 weakness priorities, and M1-M4 domains', async () => {
    await initializeDatabase();

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Performance & Study Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('197')).toBeInTheDocument();
    expect(screen.getByText(/Level 2 — Advanced Beginner/i)).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('Integrated Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('Information Security')).toBeInTheDocument();
    expect(screen.getByText('365 pts')).toBeInTheDocument();
    expect(screen.getByText('265 pts')).toBeInTheDocument();
    expect(screen.getByText('235 pts')).toBeInTheDocument();
    expect(screen.getByText('135 pts')).toBeInTheDocument();
  });
});
