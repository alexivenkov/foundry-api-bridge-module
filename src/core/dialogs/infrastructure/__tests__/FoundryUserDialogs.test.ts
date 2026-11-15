import type { QuestionSpec } from '../../domain';
import { FoundryUserDialogs } from '../FoundryUserDialogs';
import { InMemoryQuestionRegistry } from '../InMemoryQuestionRegistry';
import { randomRequestIds, systemClock } from '../runtime';
import type { FoundryDialogGlobals, FoundryDialogUser } from '../foundryDialogTypes';

const spec: QuestionSpec = { kind: 'confirm', title: 'Door', content: 'Open?', yesLabel: null, noLabel: null };

function user(query: jest.Mock, overrides: Partial<FoundryDialogUser> = {}): FoundryDialogUser {
  return { id: 'ann', name: 'Ann', active: true, query, ...overrides };
}

function gateway(
  users: FoundryDialogUser[],
  options: { generation?: number; queries?: Record<string, unknown> | undefined } = {}
): FoundryUserDialogs {
  const globals = (): FoundryDialogGlobals => ({
    game: { users: { get: (id) => users.find((candidate) => candidate.id === id) } },
    CONFIG: { queries: 'queries' in options ? options.queries : { dialog: () => null } }
  });
  return new FoundryUserDialogs(globals, () => options.generation ?? 14);
}

describe('FoundryUserDialogs', () => {
  describe('isAvailable', () => {
    it('needs Foundry 13+ and the core dialog query', () => {
      expect(gateway([], { generation: 13 }).isAvailable()).toBe(true);
      expect(gateway([], { generation: 14 }).isAvailable()).toBe(true);
      expect(gateway([], { generation: 0 }).isAvailable()).toBe(true);
      expect(gateway([], { generation: 12 }).isAvailable()).toBe(false);
      expect(gateway([], { generation: 14, queries: undefined }).isAvailable()).toBe(false);
      expect(gateway([], { generation: 14, queries: { dialog: 'x' } }).isAvailable()).toBe(false);
    });
  });

  it('finds a recipient with their connection state', () => {
    const dialogs = gateway([user(jest.fn(), { active: false })]);
    expect(dialogs.findRecipient('ann')).toEqual({ id: 'ann', name: 'Ann', active: false });
    expect(dialogs.findRecipient('zed')).toBeNull();
  });

  describe('ask', () => {
    it('sends the dialog query with the timeout and maps the reply', async () => {
      const query = jest.fn().mockResolvedValue(true);
      const outcome = await gateway([user(query)]).ask('ann', spec, 60_000);
      expect(query).toHaveBeenCalledWith(
        'dialog',
        { type: 'confirm', config: { window: { title: 'Door' }, content: '<p>Open?</p>' } },
        { timeout: 60_000 }
      );
      expect(outcome).toEqual({ type: 'answered', answer: { kind: 'confirm', confirmed: true } });
    });

    it("reads the server's acknowledgement timeout as a timeout", async () => {
      const query = jest.fn().mockRejectedValue(new Error('operation has timed out'));
      await expect(gateway([user(query)]).ask('ann', spec, 10_000)).resolves.toEqual({ type: 'timeout' });
    });

    it('reports any other refusal as a failure without rejecting', async () => {
      const query = jest.fn().mockRejectedValue(new Error('User [ann] is not active'));
      await expect(gateway([user(query)]).ask('ann', spec, 10_000)).resolves.toEqual({
        type: 'failed',
        reason: 'User [ann] is not active'
      });
      const long = jest.fn().mockRejectedValue('x'.repeat(1000));
      const outcome = await gateway([user(long)]).ask('ann', spec, 10_000);
      expect(outcome.type === 'failed' ? outcome.reason.length : 0).toBe(300);
    });

    it('fails when the user is gone', async () => {
      await expect(gateway([]).ask('ann', spec, 10_000)).resolves.toEqual({
        type: 'failed',
        reason: 'User not found: ann'
      });
    });
  });
});

describe('runtime adapters', () => {
  it('keeps questions in memory', () => {
    const registry = new InMemoryQuestionRegistry();
    const question = {
      requestId: 'q1',
      userId: 'ann',
      userName: 'Ann',
      kind: 'confirm' as const,
      title: 't',
      status: 'pending' as const,
      askedAt: 0,
      expiresAt: 1,
      settledAt: null,
      answer: null,
      error: null
    };
    registry.save(question);
    expect(registry.find('q1')).toBe(question);
    expect(registry.list()).toEqual([question]);
    registry.remove('q1');
    expect(registry.find('q1')).toBeNull();
  });

  it('generates distinct alphanumeric request ids and reads the clock', () => {
    const ids = new Set(Array.from({ length: 50 }, () => randomRequestIds.next()));
    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9]{16}$/);
    }
    expect(Math.abs(systemClock.now() - Date.now())).toBeLessThan(1000);
  });
});
