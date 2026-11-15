import { generateAsciiMap } from '../../../shared';
import {
  CombatNotFoundError,
  CurrentCombatantHasNoTokenError,
  CurrentCombatantTokenNotFoundError,
  NoActiveCombatError,
  NoBattlefieldError,
  NoCurrentCombatantError,
  type Battlefield,
  type Combat,
  type MapCollisionTest,
  type SightTest
} from '../../domain';
import { TurnContextService } from '../TurnContextService';
import {
  FakeBattlefields,
  FakeCollisions,
  FakeCombats,
  NOTHING_BLOCKS,
  battlefield,
  battlefieldToken,
  combat,
  combatant
} from './fakePorts';

const HERO = combatant({ id: 'c-hero', actorId: 'a-hero', tokenId: 'hero', name: 'Hero' });
const GOBLIN = combatant({ id: 'c-goblin', actorId: 'a-goblin', tokenId: 'goblin', name: 'Goblin' });
const SPIRIT = combatant({ id: 'c-spirit', actorId: 'a-spirit', tokenId: null, name: 'Spirit' });

const HERO_TOKEN = battlefieldToken({
  id: 'hero',
  name: 'Hero',
  x: 500,
  y: 500,
  vitals: { hp: { value: 25, max: 30 }, ac: 18 }
});
const GOBLIN_TOKEN = battlefieldToken({ id: 'goblin', name: 'Goblin', x: 700, y: 500, disposition: 'hostile' });
const BARREL_TOKEN = battlefieldToken({ id: 'barrel', name: 'Barrel', x: 600, y: 500, disposition: 'neutral' });

interface Setup {
  combats?: readonly Combat[];
  active?: string | null;
  /** The scene this client views; null when it views none. */
  scene?: Battlefield | null;
  /** Other scenes of the world, by id. The viewed one is `dungeon`. */
  otherScenes?: Readonly<Record<string, Battlefield>>;
  /** The scene the encounter knows the current token to be on. */
  currentSceneId?: string | null;
  sight?: SightTest | undefined;
  movement?: MapCollisionTest | undefined;
}

function setup(options: Setup = {}): {
  service: TurnContextService;
  scenes: FakeBattlefields;
  collisions: FakeCollisions;
} {
  const combats = options.combats ?? [
    combat({ id: 'fight', round: 3, turn: 1, turnOrder: [GOBLIN, HERO, SPIRIT], current: HERO })
  ];
  const world = new FakeCombats(combats, options.active === undefined ? 'fight' : options.active);
  world.currentSceneId = options.currentSceneId ?? null;
  const viewed =
    options.scene === undefined ? battlefield({ tokens: [HERO_TOKEN, BARREL_TOKEN, GOBLIN_TOKEN] }) : options.scene;
  const scenes = new FakeBattlefields(
    { ...options.otherScenes, ...(viewed !== null ? { dungeon: viewed } : {}) },
    viewed !== null ? 'dungeon' : null
  );
  const collisions = new FakeCollisions(options.sight, 'movement' in options ? options.movement : NOTHING_BLOCKS);
  return {
    service: new TurnContextService({ combats: world, turns: world, battlefield: scenes, collisions }),
    scenes,
    collisions
  };
}

describe('TurnContextService', () => {
  describe('whose turn it is', () => {
    it('reports the round, the turn and the current combatant with its token and cell', () => {
      const context = setup().service.describeTurn({ combatId: undefined });

      expect(context.round).toBe(3);
      expect(context.turn).toBe(1);
      expect(context.current).toEqual({ combatant: HERO, token: HERO_TOKEN, cell: { column: 5, row: 5 } });
    });

    it('describes the named combat', () => {
      const other = combat({ id: 'ambush', round: 1, turn: 0, turnOrder: [GOBLIN], current: GOBLIN });
      const { service } = setup({ combats: [combat({ id: 'fight', turnOrder: [HERO], current: HERO }), other] });

      expect(service.describeTurn({ combatId: 'ambush' }).current.combatant.id).toBe('c-goblin');
    });
  });

  describe('what cannot be described', () => {
    it('fails without an active combat', () => {
      expect(() => setup({ active: null }).service.describeTurn({ combatId: undefined })).toThrow(NoActiveCombatError);
    });

    it('fails for an unknown combat', () => {
      expect(() => setup().service.describeTurn({ combatId: 'missing' })).toThrow(CombatNotFoundError);
    });

    it('fails when it is no one\'s turn', () => {
      const { service } = setup({ combats: [combat({ id: 'fight', turnOrder: [HERO], current: null })] });

      expect(() => service.describeTurn({ combatId: undefined })).toThrow(NoCurrentCombatantError);
      expect(() => service.describeTurn({ combatId: undefined })).toThrow('No current combatant');
    });

    it.each([[null], ['']])('fails when the current combatant has a token of %j', (tokenId) => {
      const tokenless = combatant({ id: 'c-spirit', tokenId });
      const { service } = setup({ combats: [combat({ id: 'fight', turnOrder: [tokenless], current: tokenless })] });

      expect(() => service.describeTurn({ combatId: undefined })).toThrow(CurrentCombatantHasNoTokenError);
    });

    it('fails when the scene of the token is not known and this client views no scene', () => {
      const { service } = setup({ scene: null });

      expect(() => service.describeTurn({ combatId: undefined })).toThrow(NoBattlefieldError);
      expect(() => service.describeTurn({ combatId: undefined })).toThrow('No active scene');
    });

    it('fails when the token of the current combatant is not on the scene that is described', () => {
      const { service } = setup({ scene: battlefield({ tokens: [GOBLIN_TOKEN] }) });

      expect(() => service.describeTurn({ combatId: undefined })).toThrow(CurrentCombatantTokenNotFoundError);
      expect(() => service.describeTurn({ combatId: undefined })).toThrow(
        'Token not found for current combatant: hero'
      );
    });

    it('checks the combatant before it looks at any scene', () => {
      const { service, scenes } = setup({
        combats: [combat({ id: 'fight', turnOrder: [], current: null })],
        scene: null
      });

      expect(() => service.describeTurn({ combatId: undefined })).toThrow(NoCurrentCombatantError);
      expect(scenes.read).toEqual([]);
    });
  });

  describe('the scene that is described', () => {
    const CRYPT = battlefield({
      sceneName: 'Crypt',
      grid: { size: 50, distance: 2, units: 'm' },
      tokens: [
        battlefieldToken({ id: 'hero', name: 'Hero', x: 100, y: 100 }),
        battlefieldToken({ id: 'goblin', name: 'Goblin', x: 300, y: 100 })
      ],
      walls: [{ coordinates: [200, 0, 200, 300], door: 0, doorState: 0, movement: 20 }]
    });

    it('is the viewed scene when the scene of the token is not known', () => {
      const { service, scenes } = setup();

      const context = service.describeTurn({ combatId: undefined });

      expect(scenes.read).toEqual(['viewed']);
      expect(context.current.token).toBe(HERO_TOKEN);
    });

    it('is the scene of the token, whatever scene this client views', () => {
      const { service, scenes } = setup({ otherScenes: { crypt: CRYPT }, currentSceneId: 'crypt' });

      const context = service.describeTurn({ combatId: undefined });

      expect(scenes.read).toEqual(['crypt']);
      expect(context.current).toMatchObject({ token: { id: 'hero', x: 100 }, cell: { column: 2, row: 2 } });
      expect(context.nearby.map((entry) => [entry.token.id, entry.distance])).toEqual([['goblin', 8]]);
    });

    it('is the scene of the token when this client views none', () => {
      const { service } = setup({ scene: null, otherScenes: { crypt: CRYPT }, currentSceneId: 'crypt' });

      expect(service.describeTurn({ combatId: undefined }).nearby).toHaveLength(1);
    });

    it('is the viewed scene again when the scene of the token is gone', () => {
      const { service, scenes } = setup({ currentSceneId: 'burnt-down' });

      const context = service.describeTurn({ combatId: undefined });

      expect(scenes.read).toEqual(['burnt-down', 'viewed']);
      expect(context.current.token).toBe(HERO_TOKEN);
    });

    it('asks the canvas about sight and movement when the scene of the token is the viewed one', () => {
      const sight = jest.fn().mockReturnValue(true);
      const { service, collisions } = setup({ currentSceneId: 'dungeon', sight });

      const context = service.describeTurn({ combatId: undefined });

      expect(collisions.asked).toBe(2);
      expect(sight).toHaveBeenCalledTimes(1);
      expect(context.nearby[0]?.lineOfSight).toBe(false);
      expect(context.asciiMap.startsWith('Dungeon | 5ft/cell\n')).toBe(true);
    });

    it('does not ask the canvas about a scene it does not show: all is in sight and there is no map', () => {
      const sight = jest.fn().mockReturnValue(true);
      const { service, collisions } = setup({ otherScenes: { crypt: CRYPT }, currentSceneId: 'crypt', sight });

      const context = service.describeTurn({ combatId: undefined });

      expect(collisions.asked).toBe(0);
      expect(sight).not.toHaveBeenCalled();
      expect(context.nearby[0]?.lineOfSight).toBe(true);
      expect(context.asciiMap).toBe('[ASCII map unavailable — no collision backend]');
    });
  });

  describe('the surroundings', () => {
    it('lists the other participants on the scene, not the bystanders', () => {
      const { nearby } = setup().service.describeTurn({ combatId: undefined });

      expect(nearby).toEqual([
        { token: GOBLIN_TOKEN, cell: { column: 7, row: 5 }, distance: 10, lineOfSight: true }
      ]);
    });

    it('asks the sight test of the canvas', () => {
      const sight = jest.fn().mockReturnValue(true);

      const { nearby } = setup({ sight }).service.describeTurn({ combatId: undefined });

      expect(sight).toHaveBeenCalledTimes(1);
      expect(sight).toHaveBeenCalledWith({ x: 550, y: 550 }, { x: 750, y: 550 });
      expect(nearby[0]?.lineOfSight).toBe(false);
    });

    it('measures in the units of the described scene', () => {
      const scene = battlefield({
        grid: { size: 50, distance: 2, units: 'm' },
        tokens: [HERO_TOKEN, GOBLIN_TOKEN]
      });

      expect(setup({ scene }).service.describeTurn({ combatId: undefined }).nearby[0]?.distance).toBe(8);
    });

    it('measures between the footprints of large tokens and looks between their centres', () => {
      const sight = jest.fn().mockReturnValue(false);
      const ogre = battlefieldToken({ id: 'goblin', name: 'Ogre', x: 700, y: 400, width: 2, height: 2 });
      const giant = battlefieldToken({ id: 'hero', name: 'Giant', x: 300, y: 400, width: 3, height: 3 });

      const { nearby } = setup({ scene: battlefield({ tokens: [giant, ogre] }), sight }).service.describeTurn({
        combatId: undefined
      });

      expect(nearby[0]).toMatchObject({ cell: { column: 7, row: 4 }, distance: 10 });
      expect(sight).toHaveBeenCalledWith({ x: 450, y: 550 }, { x: 800, y: 500 });
    });
  });

  describe('the map', () => {
    it('is drawn twelve cells around the current combatant, with the participants only', () => {
      const scene = battlefield({
        tokens: [HERO_TOKEN, BARREL_TOKEN, GOBLIN_TOKEN],
        walls: [{ coordinates: [600, 400, 600, 600], door: 1, doorState: 2, movement: 20 }]
      });

      const { asciiMap } = setup({ scene }).service.describeTurn({ combatId: undefined });

      expect(asciiMap).toBe(
        generateAsciiMap({
          gridSize: 100,
          gridDistance: 5,
          gridUnits: 'ft',
          sceneName: 'Dungeon',
          tokens: [
            { id: 'hero', name: 'Hero', x: 500, y: 500, width: 1, height: 1, hp: { value: 25, max: 30 } },
            { id: 'goblin', name: 'Goblin', x: 700, y: 500, width: 1, height: 1, hp: undefined }
          ],
          walls: [{ c: [600, 400, 600, 600], door: 1, ds: 2, move: 20 }],
          collisionBackend: NOTHING_BLOCKS,
          center: { gx: 5, gy: 5 },
          radius: 12
        })
      );
      expect(asciiMap).toContain(`1   ${'Hero'.padEnd(30)} 1x1   25/30      (5,5)`);
      expect(asciiMap).not.toContain('Barrel');
    });

    it('draws the walls the movement test of the canvas reports, with the raw door codes of the scene', () => {
      const lockedDoor = { coordinates: [600, 500, 600, 600], door: 1, doorState: 2, movement: 20 };
      const movement: MapCollisionTest = {
        testCollision: (origin, destination) =>
          origin.y === 550 && destination.y === 550 && Math.min(origin.x, destination.x) === 550
      };

      const { asciiMap } = setup({
        scene: battlefield({ tokens: [HERO_TOKEN], walls: [lockedDoor] }),
        movement
      }).service.describeTurn({ combatId: undefined });

      expect(asciiMap).toContain(' 1 L');
    });

    it('is unavailable without a movement test', () => {
      expect(setup({ movement: undefined }).service.describeTurn({ combatId: undefined }).asciiMap).toBe(
        '[ASCII map unavailable — no collision backend]'
      );
    });
  });
});
