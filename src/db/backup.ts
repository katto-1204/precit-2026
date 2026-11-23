import {
  BackupBundleSchema,
  HistoricalScoreRecordSchema,
  UserProfileSchema,
  type BackupBundle,
  type HistoricalScoreRecord,
  type UserProfile,
} from '@/domain/schemas';
import { db, type PrepCitDB } from './database';
import { createDefaultProfile, getTodayDateIso, initializeDatabase } from './seed';

export async function updateUserProfile(
  patch: Partial<Omit<UserProfile, 'id'>>,
  database: PrepCitDB = db,
): Promise<UserProfile> {
  const current = (await database.profiles.get('primary')) ?? createDefaultProfile();
  const merged = UserProfileSchema.parse({
    ...current,
    ...patch,
    id: 'primary',
    updatedAt: new Date().toISOString(),
  });
  await database.profiles.put(merged);
  return merged;
}

export async function upsertHistoricalRecord(
  record: HistoricalScoreRecord,
  database: PrepCitDB = db,
): Promise<HistoricalScoreRecord> {
  const validated = HistoricalScoreRecordSchema.parse(record);
  await database.historicalRecords.put(validated);
  return validated;
}

export async function deleteHistoricalRecord(
  id: string,
  database: PrepCitDB = db,
): Promise<void> {
  const existing = await database.historicalRecords.get(id);
  if (existing?.isVerifiedBaseline) {
    throw new Error('The verified December 10, 2025 baseline record cannot be deleted.');
  }
  await database.historicalRecords.delete(id);
}

export async function logStudySession(
  minutesStudied: number,
  questionsPracticed: number,
  mode: string,
  database: PrepCitDB = db,
): Promise<void> {
  const today = getTodayDateIso();
  const id = `activity-${today}-${Date.now()}`;
  await database.studyActivities.put({
    id,
    date: today,
    minutesStudied,
    questionsPracticed,
    mode,
  });
}

export async function exportBackupBundle(database: PrepCitDB = db): Promise<BackupBundle> {
  const [
    profile,
    historicalRecords,
    topicMastery,
    examAttempts,
    responses,
    studyActivities,
    studySources,
    savedDiagrams,
  ] = await Promise.all([
    database.profiles.get('primary'),
    database.historicalRecords.toArray(),
    database.topicMastery.toArray(),
    database.examAttempts.toArray(),
    database.responses.toArray(),
    database.studyActivities.toArray(),
    database.studySources.toArray(),
    database.savedDiagrams.toArray(),
  ]);

  return BackupBundleSchema.parse({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'PrepCIT',
    profile: profile ?? createDefaultProfile(),
    historicalRecords,
    topicMastery,
    examAttempts,
    responses,
    studyActivities,
    studySources,
    savedDiagrams,
  });
}

export async function importBackupBundle(
  rawJson: string,
  database: PrepCitDB = db,
): Promise<{ importedRecords: number; importedMastery: number; importedAttempts: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON file. Please select a valid PrepCIT backup export.');
  }

  const result = BackupBundleSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(
      `Backup validation failed at "${firstIssue?.path.join('.') || 'root'}": ${firstIssue?.message ?? 'Invalid schema'}`,
    );
  }

  const bundle = result.data;

  await database.transaction(
    'rw',
    [
      database.profiles,
      database.historicalRecords,
      database.topicMastery,
      database.examAttempts,
      database.responses,
      database.studyActivities,
      database.studySources,
      database.savedDiagrams,
    ],
    async () => {
      await database.profiles.clear();
      await database.historicalRecords.clear();
      await database.topicMastery.clear();
      await database.examAttempts.clear();
      await database.responses.clear();
      await database.studyActivities.clear();
      await database.studySources.clear();
      await database.savedDiagrams.clear();

      await database.profiles.put(bundle.profile);
      if (bundle.historicalRecords.length) {
        await database.historicalRecords.bulkPut(bundle.historicalRecords);
      }
      if (bundle.topicMastery.length) {
        await database.topicMastery.bulkPut(bundle.topicMastery);
      }
      if (bundle.examAttempts.length) {
        await database.examAttempts.bulkPut(bundle.examAttempts);
      }
      if (bundle.responses.length) {
        await database.responses.bulkPut(bundle.responses);
      }
      if (bundle.studyActivities.length) {
        await database.studyActivities.bulkPut(bundle.studyActivities);
      }
      if (bundle.studySources.length) {
        await database.studySources.bulkPut(bundle.studySources);
      }
      if (bundle.savedDiagrams.length) {
        await database.savedDiagrams.bulkPut(bundle.savedDiagrams);
      }
    },
  );

  return {
    importedRecords: bundle.historicalRecords.length,
    importedMastery: bundle.topicMastery.length,
    importedAttempts: bundle.examAttempts.length,
  };
}

export async function resetLocalDatabase(database: PrepCitDB = db): Promise<void> {
  await database.transaction(
    'rw',
    [
      database.profiles,
      database.historicalRecords,
      database.topicMastery,
      database.examAttempts,
      database.responses,
      database.studyActivities,
      database.studySources,
      database.savedDiagrams,
    ],
    async () => {
      await Promise.all([
        database.profiles.clear(),
        database.historicalRecords.clear(),
        database.topicMastery.clear(),
        database.examAttempts.clear(),
        database.responses.clear(),
        database.studyActivities.clear(),
        database.studySources.clear(),
        database.savedDiagrams.clear(),
      ]);
    },
  );
  await initializeDatabase(database);
}
