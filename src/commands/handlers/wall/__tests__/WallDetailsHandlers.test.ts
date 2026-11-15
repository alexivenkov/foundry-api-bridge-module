import { createCreateWallHandler } from '../CreateWallHandler';
import { createGetWallsHandler } from '../GetWallsHandler';
import { createUpdateWallHandler } from '../UpdateWallHandler';
import type { FoundryWallDocument, FoundryWallGame, FoundryWallScene } from '../wallTypes';

function wallDocument(overrides: Partial<FoundryWallDocument> = {}): FoundryWallDocument {
  const doc: FoundryWallDocument = {
    _id: 'gate',
    c: [0, 0, 100, 0],
    door: 1,
    ds: 0,
    move: 20,
    sight: 20,
    sound: 20,
    light: 20,
    dir: 0,
    threshold: { light: null, sight: null, sound: null, attenuation: false },
    animation: null,
    update: jest.fn(),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

function setup(): { deps: { gameProvider: { getGame(): FoundryWallGame } }; scene: FoundryWallScene; gate: FoundryWallDocument } {
  const gate = wallDocument();
  const scene: FoundryWallScene = {
    id: 'keep',
    walls: { get: (id) => (id === gate._id ? gate : undefined), contents: [gate] },
    createEmbeddedDocuments: jest.fn((_type: 'Wall', data: Record<string, unknown>[]) =>
      Promise.resolve([wallDocument({ _id: 'new', ...(data[0] as Partial<FoundryWallDocument>) })])
    ),
    deleteEmbeddedDocuments: jest.fn()
  };
  const game: FoundryWallGame = { scenes: { get: (id) => (id === 'keep' ? scene : undefined), active: scene } };
  return { deps: { gameProvider: { getGame: () => game } }, scene, gate };
}

describe('wall handlers with wall details', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['CONFIG'];
  });

  it('creates a proximity wall with a door sound and reports the details', async () => {
    const { deps, scene } = setup();

    const result = await createCreateWallHandler(deps)({
      c: [0, 0, 100, 0],
      door: 'door',
      threshold: { sight: { proximity: 'proximity', distance: 15 } },
      doorSound: 'jail',
      animation: { type: 'slide' }
    });

    expect((scene.createEmbeddedDocuments as jest.Mock).mock.calls[0]?.[1]).toEqual([
      {
        c: [0, 0, 100, 0],
        door: 1,
        sight: 30,
        threshold: { sight: 15 },
        doorSound: 'jail',
        animation: { type: 'slide', direction: 1, double: false, duration: 750, flip: false, strength: 1, texture: null }
      }
    ]);
    expect(result).toMatchObject({
      sense: 'normal',
      threshold: { sight: { proximity: 'proximity', distance: 15 } },
      doorSound: 'jail',
      animation: { type: 'slide', reverse: false }
    });
  });

  it('lists walls with their details', async () => {
    const { deps } = setup();

    const result = await createGetWallsHandler(deps)({});

    expect(result.walls[0]).toMatchObject({ doorSound: null, animation: null, threshold: { attenuation: false } });
  });

  it('rejects a door sound the world does not register', async () => {
    (globalThis as Record<string, unknown>)['CONFIG'] = { Wall: { doorSounds: { jail: { label: 'Jail' } } } };
    const { deps, gate } = setup();

    await expect(createUpdateWallHandler(deps)({ wallId: 'gate', doorSound: 'kazoo' })).rejects.toThrow(
      'Unknown door sound: kazoo. Known: jail'
    );
    expect(gate.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid threshold distance', async () => {
    const { deps } = setup();

    await expect(createUpdateWallHandler(deps)({ wallId: 'gate', threshold: { light: { distance: 0 } } })).rejects.toThrow(
      'threshold.light.distance'
    );
  });

  it('reports a missing wall', async () => {
    const { deps } = setup();

    await expect(createUpdateWallHandler(deps)({ wallId: 'ghost', doorSound: null })).rejects.toThrow('Wall not found: ghost');
  });
});
