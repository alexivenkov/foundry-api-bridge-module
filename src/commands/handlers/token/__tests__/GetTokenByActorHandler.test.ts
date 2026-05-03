import { getTokenByActorHandler } from '../GetTokenByActorHandler';

interface MockToken {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  texture: { src: string };
  disposition: number;
  actorId?: string | null;
  actor: { id: string } | null;
}

interface MockScene {
  id: string;
  name: string;
  tokens: { get: jest.Mock; contents: MockToken[] };
}

function createMockToken(overrides: Partial<MockToken> = {}): MockToken {
  return {
    id: 'token-1',
    name: 'Goblin',
    x: 100,
    y: 100,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: 'icons/goblin.png' },
    disposition: -1,
    actorId: 'actor-1',
    actor: { id: 'actor-1' },
    ...overrides
  };
}

function createMockScene(tokens: MockToken[]): MockScene {
  return {
    id: 'scene-1',
    name: 'Test Scene',
    tokens: { get: jest.fn(), contents: tokens }
  };
}

const mockGame: { scenes: { get: jest.Mock; active: MockScene | null } } = {
  scenes: { get: jest.fn(), active: null }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('getTokenByActorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
  });

  it('returns token for the given actor on active scene', async () => {
    const token = createMockToken();
    mockGame.scenes.active = createMockScene([token]);

    const result = await getTokenByActorHandler({ actorId: 'actor-1' });

    expect(result.id).toBe('token-1');
    expect(result.actorId).toBe('actor-1');
  });

  it('returns first matching token when multiple share an actor', async () => {
    const t1 = createMockToken({ id: 'token-A' });
    const t2 = createMockToken({ id: 'token-B' });
    mockGame.scenes.active = createMockScene([t1, t2]);

    const result = await getTokenByActorHandler({ actorId: 'actor-1' });
    expect(result.id).toBe('token-A');
  });

  it('throws when no matching token exists', async () => {
    mockGame.scenes.active = createMockScene([createMockToken()]);

    await expect(getTokenByActorHandler({ actorId: 'actor-missing' })).rejects.toThrow(
      'No token for actor actor-missing on scene scene-1'
    );
  });

  it('throws when no active scene', async () => {
    mockGame.scenes.active = null;

    await expect(getTokenByActorHandler({ actorId: 'actor-1' })).rejects.toThrow('No active scene');
  });

  it('uses explicit sceneId when provided', async () => {
    const token = createMockToken();
    const scene = createMockScene([token]);
    mockGame.scenes.get.mockReturnValue(scene);

    const result = await getTokenByActorHandler({
      sceneId: 'specific-scene',
      actorId: 'actor-1'
    });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(result.id).toBe('token-1');
  });

  it('matches by token.actor.id when actorId field is undefined', async () => {
    const token = createMockToken();
    delete token.actorId;
    mockGame.scenes.active = createMockScene([token]);

    const result = await getTokenByActorHandler({ actorId: 'actor-1' });
    expect(result.id).toBe('token-1');
  });

  it('does not match tokens with null actor', async () => {
    const orphan = createMockToken({ actorId: null, actor: null });
    mockGame.scenes.active = createMockScene([orphan]);

    await expect(getTokenByActorHandler({ actorId: 'actor-1' })).rejects.toThrow(
      'No token for actor actor-1'
    );
  });
});
