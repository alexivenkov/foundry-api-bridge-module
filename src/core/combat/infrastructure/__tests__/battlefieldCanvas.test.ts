import type { Battlefield } from '../../domain';
import { FoundryBattlefieldReader, FoundryCanvasCollisions } from '../battlefieldCanvas';
import { gameWith } from './fakeDocuments';
import type {
  FoundryBattlefieldGlobals,
  FoundryBattlefieldScene,
  FoundryBattlefieldToken,
  FoundryBattlefieldWall
} from '../foundryBattlefieldTypes';

function token(overrides: Partial<FoundryBattlefieldToken> = {}): FoundryBattlefieldToken {
  return {
    id: 't1',
    name: 'Goblin',
    x: 500,
    y: 300,
    width: 1,
    height: 1,
    disposition: -1,
    actor: {
      id: 'a1',
      system: { attributes: { hp: { value: 7, max: 9 }, ac: { value: 13 } } },
      statuses: new Set(['poisoned', 'prone'])
    },
    ...overrides
  };
}

function scene(overrides: Partial<FoundryBattlefieldScene> = {}): FoundryBattlefieldScene {
  return {
    id: 'dungeon',
    name: 'Dungeon',
    grid: { size: 70, distance: 2, units: 'm' },
    tokens: { contents: [] },
    walls: { contents: [] },
    ...overrides
  };
}

/** A world with these scenes, the canvas showing what `globals` says. */
function readerOver(
  globals: FoundryBattlefieldGlobals,
  worldScenes: FoundryBattlefieldScene[] = []
): FoundryBattlefieldReader {
  const { game } = gameWith([], { scenes: worldScenes });
  return new FoundryBattlefieldReader({ getGame: () => game }, () => globals);
}

function readScene(viewed: FoundryBattlefieldScene): Battlefield {
  const battlefield = readerOver({ canvas: { scene: viewed } }).readViewedScene();
  if (battlefield === null) {
    throw new Error('expected a battlefield');
  }
  return battlefield;
}

describe('FoundryBattlefieldReader', () => {
  it('reads the name and the grid of the scene on the canvas', () => {
    expect(readScene(scene())).toEqual({
      sceneName: 'Dungeon',
      onCanvas: true,
      grid: { size: 70, distance: 2, units: 'm' },
      tokens: [],
      walls: []
    });
  });

  it('falls back to a 100 px grid of 5 ft cells', () => {
    const bare = scene({ grid: { size: undefined, distance: undefined, units: undefined } });

    expect(readScene(bare).grid).toEqual({ size: 100, distance: 5, units: 'ft' });
  });

  it.each([
    ['there is no canvas', {}],
    ['the canvas is null', { canvas: null }],
    ['the canvas has no scene', { canvas: {} }],
    ['the scene is null', { canvas: { scene: null } }]
  ])('views nothing when %s', (_case, globals: FoundryBattlefieldGlobals) => {
    expect(readerOver(globals).readViewedScene()).toBeNull();
  });

  it('reads the globals and the game on every call', () => {
    const globals = jest.fn().mockReturnValue({});
    const getGame = jest.fn().mockReturnValue(gameWith([]).game);
    const reader = new FoundryBattlefieldReader({ getGame }, globals);

    expect(globals).not.toHaveBeenCalled();
    expect(getGame).not.toHaveBeenCalled();
    reader.readViewedScene();
    reader.readScene('dungeon');
    expect(globals).toHaveBeenCalledTimes(2);
    expect(getGame).toHaveBeenCalledTimes(1);
  });

  describe('a scene by id', () => {
    const crypt = scene({ id: 'crypt', name: 'Crypt', tokens: { contents: [token({ id: 'ghoul' })] } });

    it('is read from the world when the canvas shows another scene', () => {
      const battlefield = readerOver({ canvas: { scene: scene() } }, [scene(), crypt]).readScene('crypt');

      expect(battlefield).toMatchObject({ sceneName: 'Crypt', onCanvas: false });
      expect(battlefield?.tokens.map((entry) => entry.id)).toEqual(['ghoul']);
    });

    it.each([
      ['there is no canvas', {}],
      ['the canvas is blank', { canvas: { scene: null } }]
    ])('is read from the world when %s', (_case, globals: FoundryBattlefieldGlobals) => {
      expect(readerOver(globals, [crypt]).readScene('crypt')).toMatchObject({ sceneName: 'Crypt', onCanvas: false });
    });

    it('is the scene on the canvas when that is the one asked for', () => {
      const battlefield = readerOver({ canvas: { scene: crypt } }, [scene(), crypt]).readScene('crypt');

      expect(battlefield).toMatchObject({ sceneName: 'Crypt', onCanvas: true });
    });

    it('is null for a scene the world does not have', () => {
      expect(readerOver({ canvas: { scene: scene() } }, [scene()]).readScene('missing')).toBeNull();
    });
  });

  describe('tokens', () => {
    it('maps a token with its actor, statuses and conventional vitals', () => {
      expect(readScene(scene({ tokens: { contents: [token()] } })).tokens).toEqual([
        {
          id: 't1',
          name: 'Goblin',
          x: 500,
          y: 300,
          width: 1,
          height: 1,
          disposition: 'hostile',
          actorId: 'a1',
          statuses: ['poisoned', 'prone'],
          vitals: { hp: { value: 7, max: 9 }, ac: 13 }
        }
      ]);
    });

    it('falls back to an empty name and a 1x1 size', () => {
      const sparse = token({ name: undefined, width: undefined, height: undefined });

      expect(readScene(scene({ tokens: { contents: [sparse] } })).tokens[0]).toMatchObject({
        name: '',
        width: 1,
        height: 1
      });
    });

    it('reads a token without an actor as having none, with no statuses and no vitals', () => {
      const [orphan] = readScene(scene({ tokens: { contents: [token({ actor: null })] } })).tokens;

      expect(orphan).toMatchObject({ actorId: null, statuses: [], vitals: { hp: null, ac: null } });
    });

    it('reads an actor without system data or statuses as having no vitals and no statuses', () => {
      const [plain] = readScene(scene({ tokens: { contents: [token({ actor: { id: 'a2' } })] } })).tokens;

      expect(plain).toMatchObject({ actorId: 'a2', statuses: [], vitals: { hp: null, ac: null } });
    });

    it.each([
      [-1, 'hostile'],
      [0, 'neutral'],
      [1, 'friendly'],
      [-2, 'secret'],
      [7, 'neutral'],
      [undefined, 'neutral']
    ])('reads the disposition code %s as %s', (disposition, expected) => {
      const [read] = readScene(scene({ tokens: { contents: [token({ disposition })] } })).tokens;

      expect(read?.disposition).toBe(expected);
    });
  });

  describe('walls', () => {
    it('passes the coordinates and the numeric codes through', () => {
      const wall: FoundryBattlefieldWall = { c: [0, 0, 100, 0], door: 1, ds: 2, move: 20 };

      expect(readScene(scene({ walls: { contents: [wall] } })).walls).toEqual([
        { coordinates: [0, 0, 100, 0], door: 1, doorState: 2, movement: 20 }
      ]);
    });

    it('reads a missing door state as closed', () => {
      const wall: FoundryBattlefieldWall = { c: [0, 0, 100, 0], door: 0, ds: undefined, move: 0 };

      expect(readScene(scene({ walls: { contents: [wall] } })).walls[0]?.doorState).toBe(0);
    });
  });
});

describe('FoundryCanvasCollisions', () => {
  it('offers the movement backend of the core as it is', () => {
    const move = { testCollision: jest.fn() };
    const collisions = new FoundryCanvasCollisions(() => ({ CONFIG: { Canvas: { polygonBackends: { move } } } }));

    expect(collisions.movementTest()).toBe(move);
  });

  it('asks the sight backend whether any wall blocks sight between two points', () => {
    const sight = { testCollision: jest.fn().mockReturnValue(true) };
    const collisions = new FoundryCanvasCollisions(() => ({ CONFIG: { Canvas: { polygonBackends: { sight } } } }));

    const blocked = collisions.sightTest()?.({ x: 150, y: 150 }, { x: 350, y: 150 });

    expect(blocked).toBe(true);
    expect(sight.testCollision).toHaveBeenCalledWith({ x: 150, y: 150 }, { x: 350, y: 150 }, { type: 'sight', mode: 'any' });
  });

  it('reports clear sight when the backend finds no collision', () => {
    const sight = { testCollision: jest.fn().mockReturnValue(false) };
    const collisions = new FoundryCanvasCollisions(() => ({ CONFIG: { Canvas: { polygonBackends: { sight } } } }));

    expect(collisions.sightTest()?.({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false);
  });

  it.each([
    ['no CONFIG', {}],
    ['no canvas configuration', { CONFIG: {} }],
    ['no backends', { CONFIG: { Canvas: { polygonBackends: {} } } }]
  ])('has nothing to offer with %s', (_case, globals: FoundryBattlefieldGlobals) => {
    const collisions = new FoundryCanvasCollisions(() => globals);

    expect(collisions.sightTest()).toBeUndefined();
    expect(collisions.movementTest()).toBeUndefined();
  });

  it('reads the globals on every call', () => {
    const globals = jest.fn().mockReturnValue({});
    const collisions = new FoundryCanvasCollisions(globals);

    expect(globals).not.toHaveBeenCalled();
    collisions.sightTest();
    collisions.movementTest();
    expect(globals).toHaveBeenCalledTimes(2);
  });
});
