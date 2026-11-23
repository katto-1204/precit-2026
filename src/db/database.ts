import Dexie, { type Table } from 'dexie';
import type {
  ExamAttempt,
  HistoricalScoreRecord,
  Lesson,
  Question,
  QuestionResponse,
  SavedDiagram,
  StudyActivity,
  StudySource,
  TopicMastery,
  UserProfile,
} from '@/domain/schemas';

export class PrepCitDB extends Dexie {
  profiles!: Table<UserProfile, string>;
  historicalRecords!: Table<HistoricalScoreRecord, string>;
  questions!: Table<Question, string>;
  lessons!: Table<Lesson, string>;
  examAttempts!: Table<ExamAttempt, string>;
  responses!: Table<QuestionResponse, string>;
  topicMastery!: Table<TopicMastery, string>;
  studySources!: Table<StudySource, string>;
  savedDiagrams!: Table<SavedDiagram, string>;
  studyActivities!: Table<StudyActivity, string>;

  constructor(name = 'PrepCitDB') {
    super(name);
    this.version(1).stores({
      profiles: 'id',
      historicalRecords: 'id, examDate, formatYear, isVerifiedBaseline',
      questions: 'id, domain, topicId, questionType, difficulty, sourceClassification, reviewStatus, mockSetId',
      lessons: 'id, domain, topicId',
      examAttempts: 'id, mode, status, startedAt, completedAt',
      responses: 'id, [attemptId+questionId], attemptId, questionId, isFlagged, evaluationStatus',
      topicMastery: 'topicId, domain, state, nextReviewAt',
      studySources: 'id, documentType, verified, importedAt',
      savedDiagrams: 'id, diagramType, linkedQuestionId, updatedAt',
      studyActivities: 'id, date, mode',
    });
  }
}

export const db = new PrepCitDB();
