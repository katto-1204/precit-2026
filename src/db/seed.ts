import { SEED_LESSONS } from '@/data/lessons_seed';
import { ALL_SEED_QUESTIONS } from '@/data/questions';
import {
  VERIFIED_2025_BASELINE,
  deriveInitialTopicMastery,
} from '@/domain/historicalBaseline';
import { UserProfileSchema, type StudyActivity, type UserProfile } from '@/domain/schemas';
import { db, type PrepCitDB } from './database';

function getDefaultTargetDateIso(): string {
  const target = new Date(Date.now() + 90 * 86_400_000);
  return target.toISOString().slice(0, 10);
}

export function getTodayDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeStreakDays(activities: readonly StudyActivity[]): number {
  if (activities.length === 0) return 0;
  const uniqueDates = Array.from(new Set(activities.map((a) => a.date))).sort().reverse();
  const today = getTodayDateIso();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i += 1) {
    const prev = new Date(`${uniqueDates[i - 1]}T00:00:00Z`).getTime();
    const curr = new Date(`${uniqueDates[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((prev - curr) / 86_400_000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function createDefaultProfile(): UserProfile {
  const now = new Date().toISOString();
  return UserProfileSchema.parse({
    id: 'primary',
    displayName: 'BSIT Candidate',
    targetScore: 450,
    targetExamDate: getDefaultTargetDateIso(),
    dailyStudyMinutesGoal: 60,
    descriptiveCharLimit: 1500,
    descriptiveLimitPreset: 'english_1500',
    preferredLanguages: ['python', 'sql'],
    streakDays: 0,
    lastActiveDate: getTodayDateIso(),
    updatedAt: now,
  });
}

let initPromise: Promise<void> | null = null;

export async function initializeDatabase(database: PrepCitDB = db): Promise<void> {
  const run = async () => {
    await database.transaction(
      'rw',
      [
        database.profiles,
        database.historicalRecords,
        database.topicMastery,
        database.questions,
        database.lessons,
      ],
      async () => {
        const existingProfile = await database.profiles.get('primary');
        if (!existingProfile) {
          await database.profiles.put(createDefaultProfile());
        }

        const baseline = await database.historicalRecords.get(VERIFIED_2025_BASELINE.id);
        if (!baseline) {
          await database.historicalRecords.put(VERIFIED_2025_BASELINE);
        }

        const masteryCount = await database.topicMastery.count();
        if (masteryCount === 0) {
          const initialMastery = deriveInitialTopicMastery(VERIFIED_2025_BASELINE);
          await database.topicMastery.bulkPut(initialMastery);
        }

        // Idempotently seed or refresh verified built-in 2026 question bank
        const existingQuestionCount = await database.questions.count();
        if (existingQuestionCount < ALL_SEED_QUESTIONS.length) {
          await database.questions.bulkPut([...ALL_SEED_QUESTIONS]);
        }

        // Idempotently seed structured M1-M4 study lessons
        const existingLessonCount = await database.lessons.count();
        if (existingLessonCount < SEED_LESSONS.length) {
          await database.lessons.bulkPut([...SEED_LESSONS]);
        }
      },
    );
  };

  if (database === db) {
    if (!initPromise) {
      initPromise = run().catch((err) => {
        initPromise = null;
        throw err;
      });
    }
    return initPromise;
  }

  return run();
}
