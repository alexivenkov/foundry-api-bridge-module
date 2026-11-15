import { QuestionRegistryFullError, TooManyPendingQuestionsError } from '@/core/dialogs/domain/errors/dialogErrors';
import type { DialogOutcome, UserQuestion } from '@/core/dialogs/domain/model/UserQuestion';

export const DEFAULT_TIMEOUT_SECONDS = 300;
export const MIN_TIMEOUT_SECONDS = 10;
export const MAX_TIMEOUT_SECONDS = 1800;
/** A longer text answer is cut; the core's input field has no length limit that survives its HTML cleaning. */
export const MAX_TEXT_ANSWER_LENGTH = 1000;

export interface QuestionLimits {
  /** Questions kept in all, pending or settled. */
  readonly maxQuestions: number;
  /** Dialogs one user may have open at once. */
  readonly maxPendingPerUser: number;
  /** How long a settled question stays readable. */
  readonly retentionMs: number;
  /**
   * How long past its deadline a pending question waits for the core's own
   * timeout before it is marked `timeout` locally (the core never answers when
   * the user's connection is gone).
   */
  readonly expiryGraceMs: number;
}

export const QUESTION_LIMITS: QuestionLimits = {
  maxQuestions: 100,
  maxPendingPerUser: 5,
  retentionMs: 30 * 60 * 1000,
  expiryGraceMs: 5000
};

/** A question settles once: a later outcome (a late answer after a timeout or a cancel) is ignored. */
export function settleQuestion(question: UserQuestion, outcome: DialogOutcome, now: number): UserQuestion {
  if (question.status !== 'pending') {
    return question;
  }
  switch (outcome.type) {
    case 'answered':
      return { ...question, status: 'answered', settledAt: now, answer: outcome.answer };
    case 'failed':
      return { ...question, status: 'failed', settledAt: now, error: outcome.reason };
    default:
      return { ...question, status: outcome.type, settledAt: now };
  }
}

export function cancelQuestion(question: UserQuestion, now: number): UserQuestion {
  return question.status === 'pending' ? { ...question, status: 'cancelled', settledAt: now } : question;
}

export function expireIfOverdue(question: UserQuestion, now: number, limits: QuestionLimits): UserQuestion {
  if (question.status === 'pending' && now >= question.expiresAt + limits.expiryGraceMs) {
    return { ...question, status: 'timeout', settledAt: now };
  }
  return question;
}

export function isForgotten(question: UserQuestion, now: number, limits: QuestionLimits): boolean {
  return question.settledAt !== null && now - question.settledAt >= limits.retentionMs;
}

/**
 * Whether one more question for `userId` fits, and which settled questions
 * make room for it (oldest first). Pending questions are never dropped.
 */
export function planAdmission(
  questions: readonly UserQuestion[],
  userId: string,
  limits: QuestionLimits
): readonly string[] {
  const pendingForUser = questions.filter((question) => question.status === 'pending' && question.userId === userId);
  if (pendingForUser.length >= limits.maxPendingPerUser) {
    throw new TooManyPendingQuestionsError(userId, limits.maxPendingPerUser);
  }
  const excess = questions.length - limits.maxQuestions + 1;
  if (excess <= 0) {
    return [];
  }
  const settled = questions
    .filter((question) => question.settledAt !== null)
    .sort((a, b) => (a.settledAt ?? 0) - (b.settledAt ?? 0));
  if (settled.length < excess) {
    throw new QuestionRegistryFullError(limits.maxQuestions);
  }
  return settled.slice(0, excess).map((question) => question.requestId);
}
