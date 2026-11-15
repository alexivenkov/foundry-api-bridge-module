import {
  InMemoryQuestionRegistry,
  type DialogWiring,
  type FoundryDialogGlobals,
  type FoundryDialogUser
} from '../../../../core/dialogs';
import { createAskUserHandler } from '../AskUserHandler';
import { createCancelUserQuestionHandler } from '../CancelUserQuestionHandler';
import { createGetUserAnswerHandler } from '../GetUserAnswerHandler';

interface World {
  wiring: DialogWiring;
  query: jest.Mock;
  reply(value: unknown): Promise<void>;
}

function flush(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

function world(generation = 13): World {
  let resolveReply: (value: unknown) => void = () => undefined;
  const query = jest.fn(
    () =>
      new Promise((resolve) => {
        resolveReply = resolve;
      })
  );
  const users: FoundryDialogUser[] = [
    { id: 'ann', name: 'Ann', active: true, query },
    { id: 'bob', name: 'Bob', active: false, query }
  ];
  const globals = (): FoundryDialogGlobals => ({
    game: { users: { get: (id) => users.find((candidate) => candidate.id === id) } },
    CONFIG: { queries: { dialog: () => null } }
  });
  let id = 0;
  const wiring: DialogWiring = {
    globals,
    generation: () => generation,
    registry: new InMemoryQuestionRegistry(),
    clock: { now: () => 5000 },
    ids: {
      next: () => {
        id += 1;
        return `req${String(id)}`;
      }
    }
  };
  return {
    wiring,
    query,
    reply: async (value) => {
      resolveReply(value);
      await flush();
    }
  };
}

describe('player dialog handlers', () => {
  it('ask-user returns a pending question and get-user-answer reads the reply', async () => {
    const { wiring, query, reply } = world();
    const pending = await createAskUserHandler(wiring)({
      userId: 'ann',
      kind: 'choice',
      title: 'Crossroads',
      content: 'Which way?',
      choices: ['Left', 'Right'],
      timeoutSeconds: 120
    });
    expect(pending).toEqual({
      requestId: 'req1',
      userId: 'ann',
      userName: 'Ann',
      kind: 'choice',
      title: 'Crossroads',
      status: 'pending',
      askedAt: 5000,
      expiresAt: 125_000,
      settledAt: null,
      answer: null,
      error: null
    });
    expect(query).toHaveBeenCalledWith('dialog', expect.objectContaining({ type: 'wait' }), { timeout: 120_000 });

    await reply('choice-1');
    await expect(createGetUserAnswerHandler(wiring)({ requestId: 'req1' })).resolves.toMatchObject({
      status: 'answered',
      settledAt: 5000,
      answer: { kind: 'choice', index: 1, label: 'Right' }
    });
  });

  it('cancel-user-question stops waiting and says the remote dialog stays open', async () => {
    const { wiring, reply } = world();
    await createAskUserHandler(wiring)({ userId: 'ann', kind: 'confirm', title: 'Door', content: 'Open?' });
    const result = await createCancelUserQuestionHandler(wiring)({ requestId: 'req1' });
    expect(result).toMatchObject({ cancelled: true, remoteDialogClosed: false, question: { status: 'cancelled' } });

    await reply(true);
    await expect(createGetUserAnswerHandler(wiring)({ requestId: 'req1' })).resolves.toMatchObject({
      status: 'cancelled',
      answer: null
    });
  });

  it('ask-user validates the request', async () => {
    const { wiring, query } = world();
    await expect(
      createAskUserHandler(wiring)({ userId: 'ann', kind: 'choice', title: 'x', content: 'y', choices: ['one'] })
    ).rejects.toThrow('choices');
    expect(query).not.toHaveBeenCalled();
  });

  it('ask-user refuses an unknown or disconnected user', async () => {
    const { wiring } = world();
    const handler = createAskUserHandler(wiring);
    await expect(handler({ userId: 'zed', kind: 'confirm', title: 'x', content: 'y' })).rejects.toThrow(
      'User not found: zed'
    );
    await expect(handler({ userId: 'bob', kind: 'confirm', title: 'x', content: 'y' })).rejects.toThrow(
      'is not connected'
    );
  });

  it('get-user-answer and cancel-user-question report an unknown question', async () => {
    const { wiring } = world();
    await expect(createGetUserAnswerHandler(wiring)({ requestId: 'nope' })).rejects.toThrow('Question not found: nope');
    await expect(createCancelUserQuestionHandler(wiring)({ requestId: 'nope' })).rejects.toThrow(
      'Question not found: nope'
    );
  });

  it('refuses below Foundry 13', async () => {
    const { wiring } = world(12);
    await expect(
      createAskUserHandler(wiring)({ userId: 'ann', kind: 'confirm', title: 'x', content: 'y' })
    ).rejects.toThrow('Player dialogs require Foundry 13 or newer');
  });
});
