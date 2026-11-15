import {
  QUESTION_LIMITS,
  QuestionRegistryFullError,
  TooManyPendingQuestionsError,
  cancelQuestion,
  expireIfOverdue,
  isForgotten,
  planAdmission,
  settleQuestion,
  type QuestionLimits,
  type UserQuestion
} from '..';

function question(overrides: Partial<UserQuestion> = {}): UserQuestion {
  return {
    requestId: 'q1',
    userId: 'ann',
    userName: 'Ann',
    kind: 'confirm',
    title: 'Open?',
    status: 'pending',
    askedAt: 1000,
    expiresAt: 61_000,
    settledAt: null,
    answer: null,
    error: null,
    ...overrides
  };
}

const limits: QuestionLimits = { maxQuestions: 3, maxPendingPerUser: 2, retentionMs: 10_000, expiryGraceMs: 5000 };

describe('question lifecycle', () => {
  it('uses the documented defaults', () => {
    expect(QUESTION_LIMITS).toEqual({
      maxQuestions: 100,
      maxPendingPerUser: 5,
      retentionMs: 30 * 60 * 1000,
      expiryGraceMs: 5000
    });
  });

  describe('settleQuestion', () => {
    it('records an answer', () => {
      const settled = settleQuestion(
        question(),
        { type: 'answered', answer: { kind: 'confirm', confirmed: true } },
        2000
      );
      expect(settled).toMatchObject({ status: 'answered', settledAt: 2000, answer: { kind: 'confirm', confirmed: true } });
    });

    it('records a dismissal, a timeout and a failure', () => {
      expect(settleQuestion(question(), { type: 'dismissed' }, 2000).status).toBe('dismissed');
      expect(settleQuestion(question(), { type: 'timeout' }, 2000).status).toBe('timeout');
      expect(settleQuestion(question(), { type: 'failed', reason: 'User [ann] is not active' }, 2000)).toMatchObject({
        status: 'failed',
        error: 'User [ann] is not active',
        answer: null
      });
    });

    it('ignores a late outcome', () => {
      const cancelled = question({ status: 'cancelled', settledAt: 1500 });
      expect(settleQuestion(cancelled, { type: 'answered', answer: { kind: 'confirm', confirmed: true } }, 2000)).toBe(
        cancelled
      );
    });
  });

  describe('cancelQuestion', () => {
    it('cancels a pending question only', () => {
      expect(cancelQuestion(question(), 3000)).toMatchObject({ status: 'cancelled', settledAt: 3000 });
      const answered = question({ status: 'answered', settledAt: 2000 });
      expect(cancelQuestion(answered, 3000)).toBe(answered);
    });
  });

  describe('expireIfOverdue', () => {
    it('times a pending question out once the grace after its deadline has passed', () => {
      expect(expireIfOverdue(question(), 65_999, limits).status).toBe('pending');
      expect(expireIfOverdue(question(), 66_000, limits)).toMatchObject({ status: 'timeout', settledAt: 66_000 });
    });

    it('leaves a settled question alone', () => {
      const answered = question({ status: 'answered', settledAt: 2000 });
      expect(expireIfOverdue(answered, 999_999, limits)).toBe(answered);
    });
  });

  describe('isForgotten', () => {
    it('forgets a settled question after the retention time', () => {
      expect(isForgotten(question({ status: 'answered', settledAt: 2000 }), 11_999, limits)).toBe(false);
      expect(isForgotten(question({ status: 'answered', settledAt: 2000 }), 12_000, limits)).toBe(true);
      expect(isForgotten(question(), 999_999, limits)).toBe(false);
    });
  });

  describe('planAdmission', () => {
    it('admits a question while there is room', () => {
      expect(planAdmission([question()], 'ann', limits)).toEqual([]);
    });

    it('limits the pending questions of one user', () => {
      const pending = [question({ requestId: 'a' }), question({ requestId: 'b' })];
      expect(() => planAdmission(pending, 'ann', limits)).toThrow(TooManyPendingQuestionsError);
      expect(() => planAdmission(pending, 'ann', limits)).toThrow('User ann already has 2 pending questions');
      expect(planAdmission(pending, 'bob', limits)).toEqual([]);
    });

    it('makes room by dropping the oldest settled questions', () => {
      const questions = [
        question({ requestId: 'new', status: 'answered', settledAt: 5000 }),
        question({ requestId: 'old', status: 'dismissed', settledAt: 2000 }),
        question({ requestId: 'open', userId: 'bob' })
      ];
      expect(planAdmission(questions, 'ann', limits)).toEqual(['old']);
    });

    it('never drops a pending question', () => {
      const questions = [
        question({ requestId: 'a', userId: 'u1' }),
        question({ requestId: 'b', userId: 'u2' }),
        question({ requestId: 'c', userId: 'u3' })
      ];
      expect(() => planAdmission(questions, 'ann', limits)).toThrow(QuestionRegistryFullError);
    });
  });
});
