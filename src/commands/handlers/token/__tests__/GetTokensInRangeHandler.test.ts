import { getTokensInRangeHandler } from '../GetTokensInRangeHandler';

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
  grid: { size: number; distance: number; units: string };
  tokens: { get: jest.Mock; contents: MockToken[] };
}

function createMockToken(overrides: Partial<MockToken> = {}): MockToken {
  return {
    id: 'token-X',
    name: 'Token',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: '' },
    disposition: 0,
    actorId: null,
    actor: null,
    ...overrides
  };
}

function createMockScene(tokens: MockToken[], overrides: Partial<MockScene> = {}): MockScene {
  return {
    id: 'scene-1',
    name: 'Test Scene',
    grid: { size: 100, distance: 5, units: 'ft' },
    tokens: { get: jest.fn(), contents: tokens },
    ...overrides
  };
}

const mockGame: { scenes: { get: jest.Mock; active: MockScene | null } } = {
  scenes: { get: jest.fn(), active: null }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('getTokensInRangeHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
  });

  it('returns tokens within range sorted by ascending distance', async () => {
    // Origin at (50,50). Grid 100px = 5 ft.
    // t1 at (100,0)  -> closest (100,50) -> dx=50 -> 0.5 cell -> 2.5 ft
    // t2 at (300,50) -> closest (300,50) -> dx=250 -> 2.5 cells -> 12.5 ft
    // t3 at (700,50) -> dx=650 -> 6.5 cells -> 32.5 ft (out of range 20)
    const t1 = createMockToken({ id: 't1', x: 100, y: 0 });
    const t2 = createMockToken({ id: 't2', x: 300, y: 50 });
    const t3 = createMockToken({ id: 't3', x: 700, y: 50 });
    mockGame.scenes.active = createMockScene([t2, t3, t1]);

    const result = await getTokensInRangeHandler({
      originX: 50,
      originY: 50,
      range: 20
    });

    expect(result.tokens.map(t => t.id)).toEqual(['t1', 't2']);
    expect(result.tokens[0]?.distance).toBe(2.5);
    expect(result.tokens[1]?.distance).toBe(12.5);
  });

  it('excludes the token specified in excludeTokenId', async () => {
    const origin = createMockToken({ id: 'origin', x: 0, y: 0 });
    const other = createMockToken({ id: 'other', x: 100, y: 0 });
    mockGame.scenes.active = createMockScene([origin, other]);

    const result = await getTokensInRangeHandler({
      originX: 50,
      originY: 50,
      range: 30,
      excludeTokenId: 'origin'
    });

    expect(result.tokens.map(t => t.id)).toEqual(['other']);
  });

  it('includes tokens at exactly the range boundary (inclusive)', async () => {
    // Origin (0,0). Token at (200,0) -> dx=200 px = 2 cells = 10 ft
    const t = createMockToken({ id: 'edge', x: 200, y: 0 });
    mockGame.scenes.active = createMockScene([t]);

    const result = await getTokensInRangeHandler({
      originX: 0,
      originY: 0,
      range: 10
    });

    expect(result.tokens.map(t => t.id)).toEqual(['edge']);
  });

  it('excludes tokens just outside the range', async () => {
    // Origin (0,0). Token at (250,0) -> dx=250 px = 2.5 cells = 12.5 ft
    const t = createMockToken({ id: 'beyond', x: 250, y: 0 });
    mockGame.scenes.active = createMockScene([t]);

    const result = await getTokensInRangeHandler({
      originX: 0,
      originY: 0,
      range: 10
    });

    expect(result.tokens).toEqual([]);
  });

  it('measures distance from token edge for multi-cell tokens', async () => {
    // 2x2 token at (100,100) occupies x [100..300], y [100..300]
    // Origin (400, 200): closest (300, 200) -> dx=100, dy=0 -> 5 ft
    const big = createMockToken({ id: 'big', x: 100, y: 100, width: 2, height: 2 });
    mockGame.scenes.active = createMockScene([big]);

    const result = await getTokensInRangeHandler({
      originX: 400,
      originY: 200,
      range: 10
    });

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]?.distance).toBe(5);
  });

  it('returns an empty array for a scene with no tokens', async () => {
    mockGame.scenes.active = createMockScene([]);

    const result = await getTokensInRangeHandler({
      originX: 0,
      originY: 0,
      range: 100
    });

    expect(result.tokens).toEqual([]);
  });

  it('uses explicit sceneId when provided and returns the scene units', async () => {
    const t = createMockToken({ id: 't', x: 50, y: 50 });
    const scene = createMockScene([t], {
      id: 'specific',
      grid: { size: 50, distance: 1, units: 'm' }
    });
    mockGame.scenes.get.mockReturnValue(scene);

    const result = await getTokensInRangeHandler({
      sceneId: 'specific',
      originX: 0,
      originY: 0,
      range: 5
    });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific');
    expect(result.sceneId).toBe('specific');
    expect(result.units).toBe('m');
  });

  it('maps disposition number to enum string in entries', async () => {
    const friendly = createMockToken({ id: 'f', x: 50, y: 50, disposition: 1, actorId: 'a-1' });
    const hostile = createMockToken({ id: 'h', x: 50, y: 50, disposition: -1, actorId: 'a-2' });
    const secret = createMockToken({ id: 's', x: 50, y: 50, disposition: -2, actorId: 'a-3' });
    mockGame.scenes.active = createMockScene([friendly, hostile, secret]);

    const result = await getTokensInRangeHandler({
      originX: 50,
      originY: 50,
      range: 5
    });

    const byId = new Map(result.tokens.map(t => [t.id, t.disposition]));
    expect(byId.get('f')).toBe('friendly');
    expect(byId.get('h')).toBe('hostile');
    expect(byId.get('s')).toBe('secret');
  });

  it('uses default grid values when scene.grid is missing', async () => {
    const t = createMockToken({ id: 't', x: 100, y: 0 });
    const scene = createMockScene([t]);
    delete (scene as { grid?: unknown }).grid;
    mockGame.scenes.active = scene;

    // Default gridSize=100, gridDistance=5, units='ft'
    // Origin (0,0). Token at (100,0) -> dx=100 -> 1 cell -> 5 ft
    const result = await getTokensInRangeHandler({
      originX: 0,
      originY: 0,
      range: 5
    });

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]?.distance).toBe(5);
    expect(result.units).toBe('ft');
  });

  it('throws when no active scene', async () => {
    mockGame.scenes.active = null;

    await expect(
      getTokensInRangeHandler({ originX: 0, originY: 0, range: 30 })
    ).rejects.toThrow('No active scene');
  });
});
