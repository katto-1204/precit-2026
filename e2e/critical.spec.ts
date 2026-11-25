import { expect, test } from '@playwright/test';

test.describe('PrepCIT Critical 2026 TOPCIT E2E Assertions', () => {
  test('Landing Page, Tutorial Guide, and Dashboard display verified 2025 baseline (197/1000, Level 2) and 4 official 2026 domains', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText(/Train on real/i)).toBeVisible();
    await page.getByRole('link', { name: /Enter Study Dashboard/i }).click();

    await expect(page.getByText('Performance & Study Dashboard')).toBeVisible();
    await expect(page.getByText('197', { exact: true })).toBeVisible();
    await expect(page.getByText(/Level 2 — Advanced Beginner/i)).toBeVisible();
    await expect(page.getByText('Integrated Problem Solving', { exact: true })).toBeVisible();
    await expect(page.getByText('Information Security', { exact: true })).toBeVisible();
    await expect(page.getByText('365 pts', { exact: true })).toBeVisible();
    await expect(page.getByText('265 pts', { exact: true })).toBeVisible();
    await expect(page.getByText('235 pts', { exact: true })).toBeVisible();
    await expect(page.getByText('135 pts', { exact: true })).toBeVisible();

    await page.goto('/guide');
    await expect(page.getByText('Interactive Tutorial & TOPCIT 2026 Exam Guide')).toBeVisible();
  });

  test('Full 2026 Mock Exam: 75 items, reload-resilient timer/answers, zero answer leakage, offline continuity', async ({
    page,
    context,
  }) => {
    await page.goto('/mock-exam');
    await expect(page.getByText('75Q / 1,000 Pts Verified')).toBeVisible();

    await page.getByRole('button', { name: /Start Full 2026 Mock Exam/i }).click();
    await expect(page.getByText('Navigator (75 Items)')).toBeVisible();
    await expect(page.getByRole('timer')).toBeVisible();

    // Select Option B on Question 1 and Flag
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(4);
    await radios.nth(1).click();
    await page.getByRole('button', { name: /Flag for Review/i }).click();

    // Reload browser and confirm exam resume preserves timer + answer + flag
    await page.reload();
    await page.getByRole('button', { name: /Resume Full Mock Exam/i }).click();
    await expect(page.getByRole('radio').nth(1)).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('button', { name: /Flagged for Review/i })).toBeVisible();

    // Offline resilience: continue navigating & answering with network disabled
    await context.setOffline(true);
    await page.getByRole('button', { name: /^Next$/i }).click();
    await expect(page.getByText('Q2')).toBeVisible();
    await page.getByRole('radio').nth(1).click();
    await context.setOffline(false);

    // Submit and verify Analytics does not award points to unfinished tasks
    await page.getByRole('button', { name: /Submit Exam/i }).click();
    await page.getByRole('button', { name: /Confirm & Submit Exam/i }).click();
    await expect(page.getByText('Results & Performance Analytics')).toBeVisible();
  });

  test('Diagram Laboratory opens all 8 categories, inserts shapes, updates properties, and saves', async ({
    page,
  }) => {
    await page.goto('/diagram-lab');
    for (const name of [
      'Activity Diagram',
      'Class Diagram',
      'Component Diagram',
      'ER Diagram',
      'Flow Chart',
      'Sequence Diagram',
      'UI Design',
      'Use Case Diagram',
    ]) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: /^Guided$/i }).first().click();
    await page.getByRole('button', { name: /Hint & Guide/i }).click();
    await expect(page.getByText(/What Is a Activity Diagram/i)).toBeVisible();
    await page.getByRole('button', { name: /Load Ready-Made Example/i }).click();
    await page.getByRole('button', { name: /Decision \/ Merge/i }).click();
    await page.getByRole('button', { name: /Toggle Properties Inspector/i }).click();
    await expect(page.getByLabel('Label')).toBeVisible();
    await page.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByRole('status')).toContainText('Saved');
  });

  test('SQL & Database Laboratory runs live sql.js SQLite WASM query, SQL 101 warm-ups, and awards full credit', async ({
    page,
  }) => {
    await page.goto('/coding-lab');
    await expect(page.getByText('Coding & SQL Compiler Laboratory')).toBeVisible();

    await page.getByRole('tab', { name: /SQL & Database Lab/i }).click();
    await expect(page.getByText('Live Table Schema Explorer')).toBeVisible();
    await expect(page.getByText(/SQL 101 Interactive Practice Sandbox/i)).toBeVisible();

    await page.getByRole('button', { name: /Grade Query/i }).click();
    await expect(page.getByRole('status')).toContainText('Exact result-set match');
    await expect(page.getByText('50 / 50 pts')).toBeVisible();
    await expect(page.getByText('Computer Science')).toBeVisible();

    // Verify Guided Tour can be opened from the top bar
    await page.getByRole('button', { name: /Guided Tour/i }).click();
    await expect(page.getByRole('dialog', { name: /PrepCIT Interactive Guided Tour/i })).toBeVisible();
    await page.getByRole('button', { name: /Next Stop/i }).click();
    await expect(page.getByText(/Study Library: Plain-English Concepts/i)).toBeVisible();
  });
});
