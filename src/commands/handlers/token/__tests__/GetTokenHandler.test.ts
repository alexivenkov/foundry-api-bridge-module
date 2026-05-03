import { getTokenHandler } from '../GetTokenHandler';

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
  actor: {
    id: string;
    system?: { attributes?: { hp?: { value: number; max: number }; ac?: { value: number } } };
    statuses?: Set<string>;
  } | null;
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
    x: 200,
    y: 300,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: 'icons/goblin.png' },
    disposition: -1,
    actorId: 'actor-1',
    actor: {
      id: 'actor-1',
      system: { attributes: { hp: { value: 7, max: 10 }, ac: { value: 13 } } },
      statuses: new Set<string>()
    },
    ...overrides
  };
}

function createMockScene(token: MockToken, overrides: Partial<MockScene> = {}): MockScene {
  return {
    id: 'scene-1',
    name: 'Test Scene',
    tokens: {
      get: jest.fn().mockImplementation((id: string) => (id === token.id ? token : undefined)),
      contents: [token]
    },
    ...overrides
  };
}

const mockGame: { scenes: { get: jest.Mock; active: MockScene | null } } = {
  scenes: { get: jest.fn(), active: null }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('getTokenHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
  });

  it('returns mapped detail for token on active scene', async () => {
    const token = createMockToken();
    const scene = createMockScene(token);
    mockGame.scenes.active = scene;

    const result = await getTokenHandler({ tokenId: 'token-1' });

    expect(result).toEqual({
      id: 'token-1',
      sceneId: 'scene-1',
      name: 'Goblin',
      x: 200,
      y: 300,
      width: 1,
      height: 1,
      elevation: 0,
      rotation: 0,
      hidden: false,
      disposition: 'hostile',
      actorId: 'actor-1',
      textureSrc: 'icons/goblin.png',
      hp: { current: 7, max: 10 },
      ac: 13
    });
  });

  it('uses explicit sceneId when provided', async () => {
    const token = createMockToken();
    const scene = createMockScene(token, { id: 'specific-scene' });
    mockGame.scenes.get.mockReturnValue(scene);

    const result = await getTokenHandler({ sceneId: 'specific-scene', tokenId: 'token-1' });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(result.sceneId).toBe('specific-scene');
  });

  it('throws when token not found', async () => {
    const token = createMockToken();
    const scene = createMockScene(token);
    scene.tokens.get.mockReturnValue(undefined);
    mockGame.scenes.active = scene;

    await expect(getTokenHandler({ tokenId: 'missing' })).rejects.toThrow(
      'Token not found: missing'
    );
  });

  it('throws when explicit scene not found', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(
      getTokenHandler({ sceneId: 'nonexistent', tokenId: 'token-1' })
    ).rejects.toThrow('Scene not found: nonexistent');
  });

  it('throws when no active scene', async () => {
    mockGame.scenes.active = null;

    await expect(getTokenHandler({ tokenId: 'token-1' })).rejects.toThrow('No active scene');
  });

  it('returns hp=null and ac=null when actor is missing', async () => {
    const token = createMockToken({ actorId: null, actor: null });
    const scene = createMockScene(token);
    mockGame.scenes.active = scene;

    const result = await getTokenHandler({ tokenId: 'token-1' });

    expect(result.actorId).toBeNull();
    expect(result.hp).toBeNull();
    expect(result.ac).toBeNull();
  });

  it('returns hp=null when hp data is incomplete', async () => {
    const token = createMockToken({
      actor: {
        id: 'actor-1',
        system: { attributes: { ac: { value: 13 } } }
      }
    });
    const scene = createMockScene(token);
    mockGame.scenes.active = scene;

    const result = await getTokenHandler({ tokenId: 'token-1' });
    expect(result.hp).toBeNull();
    expect(result.ac).toBe(13);
  });

  it('maps disposition number to enum string', async () => {
    const tokenSecret = createMockToken({ disposition: -2 });
    mockGame.scenes.active = createMockScene(tokenSecret);
    let r = await getTokenHandler({ tokenId: 'token-1' });
    expect(r.disposition).toBe('secret');

    const tokenFriendly = createMockToken({ disposition: 1 });
    mockGame.scenes.active = createMockScene(tokenFriendly);
    r = await getTokenHandler({ tokenId: 'token-1' });
    expect(r.disposition).toBe('friendly');

    const tokenNeutral = createMockToken({ disposition: 0 });
    mockGame.scenes.active = createMockScene(tokenNeutral);
    r = await getTokenHandler({ tokenId: 'token-1' });
    expect(r.disposition).toBe('neutral');
  });

  it('falls back to actor.id when actorId field is undefined', async () => {
    const token = createMockToken();
    delete token.actorId;
    const scene = createMockScene(token);
    mockGame.scenes.active = scene;

    const result = await getTokenHandler({ tokenId: 'token-1' });
    expect(result.actorId).toBe('actor-1');
  });

  it('returns textureSrc from token.texture.src', async () => {
    const token = createMockToken({ texture: { src: 'icons/different.png' } });
    const scene = createMockScene(token);
    mockGame.scenes.active = scene;

    const result = await getTokenHandler({ tokenId: 'token-1' });
    expect(result.textureSrc).toBe('icons/different.png');
  });
});
