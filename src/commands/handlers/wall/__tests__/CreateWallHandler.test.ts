import { createWallHandler } from '../CreateWallHandler';
import type { FoundryWallDocument } from '../wallTypes';

interface MockScene {
  id: string;
  walls: {
    get: jest.Mock;
    contents: FoundryWallDocument[];
  };
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

const makeMockWall = (overrides: Partial<FoundryWallDocument> = {}): FoundryWallDocument => ({
  _id: 'wall-new',
  c: [10, 20, 30, 40],
  door: 0,
  ds: 0,
  move: 1,
  sense: 1,
  sound: 1,
  light: 1,
  dir: 0,
  update: jest.fn(),
  ...overrides
});

const makeMockScene = (id = 'scene-1'): MockScene => ({
  id,
  walls: {
    get: jest.fn(),
    contents: []
  },
  createEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn()
});

const mockGame = {
  scenes: {
    get: jest.fn() as jest.Mock,
    active: null as MockScene | null
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

describe('createWallHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = makeMockScene('active-scene');
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('creates a wall with only required c coordinates', async () => {
    const created = makeMockWall({ _id: 'w-new', c: [0, 0, 100, 100] });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    const result = await createWallHandler({ c: [0, 0, 100, 100] });

    expect(mockGame.scenes.active!.createEmbeddedDocuments).toHaveBeenCalledWith('Wall', [
      { c: [0, 0, 100, 100] }
    ]);
    expect(result).toEqual({
      id: 'w-new',
      c: [0, 0, 100, 100],
      door: 'none',
      doorState: 'closed',
      move: 'normal',
      sense: 'normal',
      sound: 'normal',
      light: 'normal',
      dir: 'both'
    });
  });

  it('creates a wall with all optional flags including secret/locked door', async () => {
    const created = makeMockWall({
      _id: 'w-secret',
      c: [5, 5, 50, 50],
      door: 2,
      ds: 2,
      move: 0,
      sense: 2,
      sound: 2,
      light: 1,
      dir: 1
    });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    const result = await createWallHandler({
      c: [5, 5, 50, 50],
      door: 'secret',
      doorState: 'locked',
      move: 'none',
      sense: 'limited',
      sound: 'limited',
      light: 'normal',
      dir: 'left'
    });

    expect(mockGame.scenes.active!.createEmbeddedDocuments).toHaveBeenCalledWith('Wall', [
      {
        c: [5, 5, 50, 50],
        door: 2,
        ds: 2,
        move: 0,
        sense: 2,
        sound: 2,
        light: 1,
        dir: 1
      }
    ]);
    expect(result).toEqual({
      id: 'w-secret',
      c: [5, 5, 50, 50],
      door: 'secret',
      doorState: 'locked',
      move: 'none',
      sense: 'limited',
      sound: 'limited',
      light: 'normal',
      dir: 'left'
    });
  });

  it('maps door enum values correctly: door=door → 1', async () => {
    const created = makeMockWall({ door: 1, ds: 1 });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createWallHandler({
      c: [0, 0, 10, 10],
      door: 'door',
      doorState: 'open'
    });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]).toEqual({
      c: [0, 0, 10, 10],
      door: 1,
      ds: 1
    });
  });

  it('uses scene specified by sceneId', async () => {
    const specificScene = makeMockScene('specific-scene');
    const created = makeMockWall();
    specificScene.createEmbeddedDocuments.mockResolvedValue([created]);
    mockGame.scenes.get.mockReturnValue(specificScene);

    await createWallHandler({ sceneId: 'specific-scene', c: [0, 0, 1, 1] });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(specificScene.createEmbeddedDocuments).toHaveBeenCalled();
  });

  it('uses active scene when sceneId omitted', async () => {
    const created = makeMockWall();
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createWallHandler({ c: [0, 0, 1, 1] });

    expect(mockGame.scenes.get).not.toHaveBeenCalled();
    expect(mockGame.scenes.active!.createEmbeddedDocuments).toHaveBeenCalled();
  });

  it('throws when no active scene and no sceneId provided', async () => {
    mockGame.scenes.active = null;

    await expect(createWallHandler({ c: [0, 0, 1, 1] }))
      .rejects.toThrow('No active scene; specify sceneId');
  });

  it('throws when createEmbeddedDocuments returns empty array', async () => {
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([]);

    await expect(createWallHandler({ c: [0, 0, 1, 1] }))
      .rejects.toThrow('Wall creation returned no document');
  });

  it('omits flags from payload when not provided', async () => {
    const created = makeMockWall();
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createWallHandler({ c: [1, 2, 3, 4] });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    const sent = payload[0] as Record<string, unknown>;
    expect(sent).not.toHaveProperty('door');
    expect(sent).not.toHaveProperty('ds');
    expect(sent).not.toHaveProperty('move');
    expect(sent).not.toHaveProperty('sense');
    expect(sent).not.toHaveProperty('sound');
    expect(sent).not.toHaveProperty('light');
    expect(sent).not.toHaveProperty('dir');
  });
});
