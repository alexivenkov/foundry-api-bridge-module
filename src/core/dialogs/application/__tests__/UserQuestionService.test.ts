import { CoreFeatureUnavailableError } from '../../../shared';
import {
  QuestionNotFoundError,
  QuestionUserNotFoundError,
  TooManyPendingQuestionsError,
  UserNotConnectedError,
  type QuestionLimits,
  type QuestionRegistry,
  type UserQuestion
} from '../../domain';
import { InMemoryQuestionRegistry } from '../../infrastructure';
import { UserQuestionService } from '../UserQuestionService';
import { FakeClock, FakeUserDialogs, SequentialIds, confirmSpec } from './fakePorts';

interface Setup {
  service: UserQuestionService;
  dialogs: FakeUserDialogs;
  clock: FakeClock;
  registry: QuestionRegistry;
}

function setup(limits?: QuestionLimits, ids = new SequentialIds()): Setup {
  const dialogs = new FakeUserDialogs([
    { id: 'ann', name: 'Ann', active: true },
    { id: 'bob', name: 'Bob', active: false }
  ]);
  const clock = new FakeClock();
  const registry = new InMemoryQuestionRegistry();
  return { service: new UserQuestionService({ dialogs, registry, clock, ids, limits }), dialogs, clock, registry };
}

const ask = { userId: 'ann', spec: confirmSpec, timeoutMs: 60_000 };

describe('UserQuestionService', () => {
  describe('ask', () => {
    it('returns the pending question at once and shows the dialog', () => {
      const { service, dialogs } = setup();
      const question = service.ask(ask);
      expect(question).toEqual<UserQuestion>({
        requestId: 'q1',
        userId: 'ann',
        userName: 'Ann',
        kind: 'confirm',
        title: 'The door',
        status: 'pending',
        askedAt: 1_000_000,
        expiresAt: 1_060_000,
        settledAt: null,
        answer: null,
        error: null
      });
      expect(dialogs.asks).toHaveLength(1);
      expect(dialogs.asks[0]).toMatchObject({ userId: 'ann', spec: confirmSpec, timeoutMs: 60_000 });
    });

    it('records the answer when the player replies', async () => {
      const { service, dialogs, clock } = setup();
      const { requestId } = service.ask(ask);
      clock.time += 4000;
      await dialogs.answer(0, { type: 'answered', answer: { kind: 'confirm', confirmed: false } });
      expect(service.getAnswer({ requestId })).toMatchObject({
        status: 'answered',
        settledAt: 1_004_000,
        answer: { kind: 'confirm', confirmed: false }
      });
    });

    it('records a gateway that rejects after all as failed', async () => {
      const { service, dialogs } = setup();
      const { requestId } = service.ask(ask);
      await dialogs.fail(0, new Error('socket closed'));
      expect(service.getAnswer({ requestId })).toMatchObject({ status: 'failed', error: 'socket closed' });
    });

    it('refuses an unknown or disconnected user', () => {
      const { service, dialogs } = setup();
      expect(() => service.ask({ ...ask, userId: 'zed' })).toThrow(new QuestionUserNotFoundError('zed'));
      expect(() => service.ask({ ...ask, userId: 'bob' })).toThrow(UserNotConnectedError);
      expect(() => service.ask({ ...ask, userId: 'bob' })).toThrow('User Bob (bob) is not connected');
      expect(dialogs.asks).toEqual([]);
    });

    it('refuses below Foundry 13', () => {
      const { service, dialogs } = setup();
      dialogs.available = false;
      expect(() => service.ask(ask)).toThrow(CoreFeatureUnavailableError);
      expect(() => service.ask(ask)).toThrow('Player dialogs require Foundry 13 or newer');
      expect(() => service.getAnswer({ requestId: 'q1' })).toThrow(CoreFeatureUnavailableError);
      expect(() => service.cancel({ requestId: 'q1' })).toThrow(CoreFeatureUnavailableError);
    });

    it('limits the pending questions per user and drops old settled ones to make room', async () => {
      const limits = { maxQuestions: 2, maxPendingPerUser: 1, retentionMs: 60_000, expiryGraceMs: 0 };
      const { service, dialogs, registry } = setup(limits);
      service.ask(ask);
      expect(() => service.ask(ask)).toThrow(TooManyPendingQuestionsError);

      await dialogs.answer(0, { type: 'dismissed' });
      const second = service.ask(ask);
      await dialogs.answer(1, { type: 'dismissed' });
      service.ask(ask);
      expect(registry.list().map((question) => question.requestId)).toEqual([second.requestId, 'q3']);
    });

    it('never reuses the id of a question it still holds', () => {
      const { service } = setup(undefined, new SequentialIds(['dup', 'dup', 'fresh']));
      service.ask(ask);
      expect(service.ask({ ...ask, userId: 'ann' }).requestId).not.toBe('dup');
    });
  });

  describe('getAnswer', () => {
    it('reports a question as timed out once its deadline and the grace have passed', () => {
      const { service, clock } = setup();
      const { requestId } = service.ask(ask);
      clock.time += 60_000 + 4999;
      expect(service.getAnswer({ requestId }).status).toBe('pending');
      clock.time += 1;
      expect(service.getAnswer({ requestId })).toMatchObject({ status: 'timeout', settledAt: 1_065_000 });
    });

    it('ignores an answer that arrives after the timeout', async () => {
      const { service, dialogs, clock } = setup();
      const { requestId } = service.ask(ask);
      clock.time += 70_000;
      service.getAnswer({ requestId });
      await dialogs.answer(0, { type: 'answered', answer: { kind: 'confirm', confirmed: true } });
      expect(service.getAnswer({ requestId })).toMatchObject({ status: 'timeout', answer: null });
    });

    it('forgets a settled question after the retention time', async () => {
      const { service, dialogs, clock } = setup();
      const { requestId } = service.ask(ask);
      await dialogs.answer(0, { type: 'dismissed' });
      clock.time += 30 * 60 * 1000;
      expect(() => service.getAnswer({ requestId })).toThrow(new QuestionNotFoundError(requestId));
    });

    it('reports an unknown id', () => {
      expect(() => setup().service.getAnswer({ requestId: 'nope' })).toThrow('Question not found: nope');
    });
  });

  describe('cancel', () => {
    it('stops waiting for a pending question and ignores a later answer', async () => {
      const { service, dialogs } = setup();
      const { requestId } = service.ask(ask);
      const result = service.cancel({ requestId });
      expect(result.cancelled).toBe(true);
      expect(result.question.status).toBe('cancelled');

      await dialogs.answer(0, { type: 'answered', answer: { kind: 'confirm', confirmed: true } });
      expect(service.getAnswer({ requestId }).status).toBe('cancelled');
    });

    it('leaves a settled question as it is', async () => {
      const { service, dialogs } = setup();
      const { requestId } = service.ask(ask);
      await dialogs.answer(0, { type: 'dismissed' });
      expect(service.cancel({ requestId })).toMatchObject({ cancelled: false, question: { status: 'dismissed' } });
    });

    it('reports an unknown id', () => {
      expect(() => setup().service.cancel({ requestId: 'nope' })).toThrow(QuestionNotFoundError);
    });
  });
});
