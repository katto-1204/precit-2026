import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  deleteHistoricalRecord,
  exportBackupBundle,
  importBackupBundle,
  updateUserProfile,
} from '@/db/backup';
import { PrepCitDB } from '@/db/database';
import { initializeDatabase } from '@/db/seed';
import { VERIFIED_2025_BASELINE } from '@/domain/historicalBaseline';

describe('PrepCitDB local-first persistence & backup roundtrip', () => {
  let testDb: PrepCitDB;

  beforeEach(async () => {
    testDb = new PrepCitDB(`PrepCitTest-${Date.now()}-${Math.random()}`);
    await initializeDatabase(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('idempotently seeds default profile, verified 2025 baseline, and 19 syllabus topics', async () => {
    await initializeDatabase(testDb); // call twice to verify idempotency

    const profile = await testDb.profiles.get('primary');
    const baseline = await testDb.historicalRecords.get(VERIFIED_2025_BASELINE.id);
    const masteryCount = await testDb.topicMastery.count();

    expect(profile?.targetScore).toBe(450);
    expect(baseline?.totalScore).toBe(197);
    expect(baseline?.correctItems).toBe(25);
    expect(masteryCount).toBe(19);
  });

  it('persists profile target updates and protects verified baseline from deletion', async () => {
    await updateUserProfile({ targetScore: 520 }, testDb);
    const updated = await testDb.profiles.get('primary');
    expect(updated?.targetScore).toBe(520);

    await expect(
      deleteHistoricalRecord(VERIFIED_2025_BASELINE.id, testDb),
    ).rejects.toThrow(/cannot be deleted/i);
  });

  it('exports and re-imports a validated JSON backup bundle cleanly', async () => {
    await updateUserProfile({ targetScore: 610, displayName: 'Alex BSIT' }, testDb);
    const bundle = await exportBackupBundle(testDb);
    const json = JSON.stringify(bundle);

    // Import into a brand new database instance
    const restoreDb = new PrepCitDB(`PrepCitRestore-${Date.now()}-${Math.random()}`);
    try {
      const summary = await importBackupBundle(json, restoreDb);
      expect(summary.importedRecords).toBe(1);
      expect(summary.importedMastery).toBe(19);

      const restoredProfile = await restoreDb.profiles.get('primary');
      expect(restoredProfile?.targetScore).toBe(610);
      expect(restoredProfile?.displayName).toBe('Alex BSIT');
    } finally {
      await restoreDb.delete();
    }
  });
});
