import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SQL_CHALLENGES } from '@/data/labChallenges';
import { db } from '@/db/database';
import { initializeDatabase } from '@/db/seed';
import { DiagramLabPage } from '@/pages/DiagramLabPage';

describe('Phase 4/6 — Diagram Lab UI & SQL Challenge Bank Integration', () => {
  it('renders all 8 Diagram Lab categories, opens Activity workspace, inserts shape, toggles inspector, validates & saves', async () => {
    await initializeDatabase();
    await db.savedDiagrams.clear();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DiagramLabPage />
      </MemoryRouter>,
    );

    // Verify all 8 diagram categories exist on homepage
    expect(screen.getByText('Activity Diagram')).toBeInTheDocument();
    expect(screen.getByText('Class Diagram')).toBeInTheDocument();
    expect(screen.getByText('Component Diagram')).toBeInTheDocument();
    expect(screen.getByText('ER Diagram')).toBeInTheDocument();
    expect(screen.getByText('Flow Chart')).toBeInTheDocument();
    expect(screen.getByText('Sequence Diagram')).toBeInTheDocument();
    expect(screen.getByText('UI Design')).toBeInTheDocument();
    expect(screen.getByText('Use Case Diagram')).toBeInTheDocument();

    // Open Activity Diagram in Guided mode
    const guidedButtons = screen.getAllByRole('button', { name: /Guided/i });
    await user.click(guidedButtons[0]);

    // Inspector should be collapsed by default (matching official TOPCIT workflow)
    expect(screen.queryByLabelText('Properties Inspector')).not.toBeInTheDocument();

    // Insert a Decision shape from left palette
    const decisionBtn = await screen.findByRole('button', { name: /Decision \/ Merge/i });
    await user.click(decisionBtn);

    // Toggle Properties Inspector open and edit selected node label
    await user.click(screen.getByRole('button', { name: /Toggle Properties Inspector/i }));
    const labelInput = await screen.findByLabelText('Label');
    await user.clear(labelInput);
    await user.type(labelInput, 'Prerequisites Met?');
    expect(labelInput).toHaveValue('Prerequisites Met?');

    // Run Structural Rubric Validation
    await user.click(screen.getByRole('button', { name: /Validate/i }));
    expect(screen.getByText('Structural Rubric Evaluation')).toBeInTheDocument();

    // Save diagram to local IndexedDB and verify persistence
    await user.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(async () => {
      const saved = await db.savedDiagrams.toArray();
      expect(saved.length).toBe(1);
      expect(saved[0].diagramType).toBe('uml_activity');
      expect(saved[0].nodesJson).toContain('Prerequisites Met?');
    });
  });

  it('ships deterministic SQL challenges with fresh schemas and reference queries', () => {
    expect(SQL_CHALLENGES.length).toBeGreaterThanOrEqual(2);
    for (const ch of SQL_CHALLENGES) {
      expect(ch.schemaSql).toContain('CREATE TABLE');
      expect(ch.expectedSql.toUpperCase()).toContain('SELECT');
    }
  });
});
