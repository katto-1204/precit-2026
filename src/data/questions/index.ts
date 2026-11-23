import { BLUEPRINT_2026, validateExamBlueprint } from '@/domain/blueprint2026';
import { QuestionSchema, type Question } from '@/domain/schemas';
import { M1_QUESTIONS } from './m1_questions';
import { M2_QUESTIONS } from './m2_questions';
import { M3_QUESTIONS } from './m3_questions';
import { M4_QUESTIONS } from './m4_questions';

/**
 * Complete original 75-question 2026 TOPCIT-format mock examination set.
 * Allocation:
 * - M1 Software Development: 21 items / 365 pts
 * - M2 Data Management: 19 items / 265 pts
 * - M3 Systems Architecture & Information Security: 18 items / 235 pts
 * - M4 IT Business: 17 items / 135 pts
 * Total: 75 items / 1,000 points
 */
export const MOCK_2026_SET_1: readonly Question[] = [
  ...M1_QUESTIONS,
  ...M2_QUESTIONS,
  ...M3_QUESTIONS,
  ...M4_QUESTIONS,
];

/**
 * Extra targeted security & integrated drill items (outside Mock Set 1)
 * focused on the user's #1 and #2 verified 2025 baseline weaknesses.
 */
export const EXTRA_WEAKNESS_DRILL_QUESTIONS: readonly Question[] = [
  {
    id: 'DRILL-SEC-01',
    title: 'JWT Security — Algorithm Confusion & Storage',
    prompt:
      'A web app uses JSON Web Tokens (JWT) signed with RS256 (asymmetric RSA) and stores them in `localStorage`. Which two vulnerabilities are most critical to remediate?',
    domain: 'M3',
    topicId: 'M3-SEC-TECH',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      {
        id: 'A',
        text: 'XSS token exfiltration from localStorage (use HttpOnly/Secure cookies instead) and failing to pin allowed verification algorithms on the server (preventing `alg: none` or HS256/RS256 key confusion).',
      },
      {
        id: 'B',
        text: 'JWT headers are encrypted by default so they cannot be parsed by proxies.',
      },
      {
        id: 'C',
        text: 'RS256 requires sending the private key to the browser.',
      },
      {
        id: 'D',
        text: 'JWTs automatically prevent CSRF without any cookie flags.',
      },
    ],
    correctOptionId: 'A',
    explanation:
      'Any JavaScript running via XSS can read `localStorage` tokens; HttpOnly cookies protect against JS access. Additionally, servers must strictly whitelist the expected JWT signing algorithm (e.g., `algorithms: ["RS256"]`).',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — Authentication & Token Security' }],
    sourceClassification: 'original_practice',
    contentVersion: '2026.1.0',
    reviewStatus: 'verified',
    estimatedSeconds: 75,
  },
  {
    id: 'DRILL-SEC-02',
    title: 'Symmetric Block Cipher Modes: ECB vs GCM',
    prompt:
      'Why must Electronic Codebook (ECB) mode NEVER be used to encrypt multi-block structured data or images, and what makes AES-GCM superior?',
    domain: 'M3',
    topicId: 'M3-SEC-TECH',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      {
        id: 'A',
        text: 'ECB encrypts identical plaintext blocks into identical ciphertext blocks (leaking patterns) and provides no integrity check; AES-GCM uses a unique nonce/IV and provides Authenticated Encryption (confidentiality + integrity).',
      },
      {
        id: 'B',
        text: 'ECB uses asymmetric RSA keys which are too slow.',
      },
      {
        id: 'C',
        text: 'AES-GCM does not require a secret key.',
      },
      {
        id: 'D',
        text: 'ECB only works on 1024-bit blocks.',
      },
    ],
    correctOptionId: 'A',
    explanation:
      'ECB is deterministic per block, preserving visual/structural patterns (the famous "ECB penguin"). AES-GCM is an AEAD cipher ensuring semantic security (via unique IV/nonce) plus authentication tags preventing ciphertext tampering.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — Applied Cryptography' }],
    sourceClassification: 'original_practice',
    contentVersion: '2026.1.0',
    reviewStatus: 'verified',
    estimatedSeconds: 75,
  },
  {
    id: 'DRILL-SEC-03',
    title: 'OAuth 2.0 Authorization Code Flow with PKCE',
    prompt:
      'Why is PKCE (Proof Key for Code Exchange) mandatory for public clients (SPAs and mobile apps) using OAuth 2.0 Authorization Code Flow?',
    domain: 'M3',
    topicId: 'M3-SEC-FUND',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      {
        id: 'A',
        text: 'Public clients cannot safely store a static client_secret; PKCE binds the authorization code to a per-flow cryptographic `code_verifier`/`code_challenge` preventing code interception attacks.',
      },
      {
        id: 'B',
        text: 'PKCE replaces HTTPS completely so traffic can run over plain HTTP.',
      },
      {
        id: 'C',
        text: 'PKCE eliminates the need for user authentication.',
      },
      {
        id: 'D',
        text: 'PKCE encrypts SQL queries on the backend.',
      },
    ],
    correctOptionId: 'A',
    explanation:
      'PKCE prevents an attacker who intercepts an authorization code on a redirect URI from exchanging it for tokens because they lack the original random `code_verifier`.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.4 — Modern Auth Protocols' }],
    sourceClassification: 'original_practice',
    contentVersion: '2026.1.0',
    reviewStatus: 'verified',
    estimatedSeconds: 75,
  },
];

export const ALL_SEED_QUESTIONS: readonly Question[] = [
  ...MOCK_2026_SET_1,
  ...EXTRA_WEAKNESS_DRILL_QUESTIONS,
];

/**
 * Runtime self-verification helper used by seeders and automated tests.
 */
export function verifySeedQuestionBank(): {
  schemaErrors: string[];
  blueprintResult: ReturnType<typeof validateExamBlueprint>;
} {
  const schemaErrors: string[] = [];
  for (const q of ALL_SEED_QUESTIONS) {
    const parsed = QuestionSchema.safeParse(q);
    if (!parsed.success) {
      schemaErrors.push(
        `${q.id}: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }
  }
  const blueprintResult = validateExamBlueprint(MOCK_2026_SET_1);
  if (
    blueprintResult.totalQuestions !== BLUEPRINT_2026.totalQuestions ||
    blueprintResult.totalPoints !== BLUEPRINT_2026.totalPoints
  ) {
    schemaErrors.push('MOCK_2026_SET_1 does not match 75 questions / 1,000 points.');
  }
  return { schemaErrors, blueprintResult };
}
