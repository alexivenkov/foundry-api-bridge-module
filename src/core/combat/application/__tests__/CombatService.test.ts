import {
  CombatAlreadyStartedError,
  CombatCreationCancelledError,
  CombatNotFoundError,
  CombatNotStartedError,
  CombatantNotInTurnOrderError,
  NoActiveCombatError,
  type Combat
} from '../../domain';
import { CombatService } from '../CombatService';
import { requireCombat } from '../requireCombat';
import { FakeCombats, combat, combatant } from './fakePorts';

const WIZARD = combatant({ id: 'wizard', name: 'Wizard', initiative: 18 });
const GOBLIN = combatant({ id: 'goblin', name: 'Goblin', initiative: 12 });

function setup(options: { combats?: readonly Combat[]; active?: string | null } = {}): {
  service: CombatService;
  world: FakeCombats;
} {
  const combats = options.combats ?? [
    combat({ id: 'fight', turnOrder: [WIZARD, GOBLIN], current: WIZARD }),
    combat({ id: 'ambush', round: 0, started: false, turnOrder: [GOBLIN], current: null })
  ];
  const world = new FakeCombats(combats, options.active === undefined ? 'fight' : options.active);
  return { service: new CombatService({ combats: world, store: world, scenes: world }), world };
}

describe('requireCombat', () => {
  it('resolves the named combat', () => {
    expect(requireCombat(setup().world, 'ambush')).toEqual({ id: 'ambush' });
  });

  it('resolves the active combat when none is named', () => {
    expect(requireCombat(setup().world, undefined)).toEqual({ id: 'fight' });
  });

  it('rejects an unknown combat by its id', () => {
    expect(() => requireCombat(setup().world, 'missing')).toThrow(CombatNotFoundError);
    expect(() => requireCombat(setup().world, 'missing')).toThrow('Combat not found: missing');
  });

  it('rejects a request without a combat when none is active', () => {
    expect(() => requireCombat(setup({ active: null }).world, undefined)).toThrow(NoActiveCombatError);
  });

  it('reads an empty id as an id, not as an omitted one', () => {
    expect(() => requireCombat(setup().world, '')).toThrow(CombatNotFoundError);
  });
});

describe('CombatService', () => {
  describe('getCombat', () => {
    it('reads the active combat when none is named', () => {
      expect(setup().service.getCombat({ combatId: undefined }).id).toBe('fight');
    });

    it('reads the named combat with its turn order and current combatant', () => {
      const state = setup().service.getCombat({ combatId: 'fight' });

      expect(state.turnOrder.map((entry) => entry.id)).toEqual(['wizard', 'goblin']);
      expect(state.current?.id).toBe('wizard');
    });

    it('fails without an active combat', () => {
      expect(() => setup({ active: null }).service.getCombat({ combatId: undefined })).toThrow('No active combat');
    });
  });

  describe('createCombat', () => {
    it('links the new combat to the active scene when no scene is named', async () => {
      const { service, world } = setup();

      await service.createCombat({ sceneId: undefined, activate: false });

      expect(world.drafts).toEqual([{ sceneId: 'dungeon', activate: false }]);
    });

    it('links it to the named scene instead', async () => {
      const { service, world } = setup();

      await service.createCombat({ sceneId: 'tavern', activate: false });

      expect(world.drafts[0]?.sceneId).toBe('tavern');
    });

    it('leaves the scene to the core when none is named and none is active', async () => {
      const { service, world } = setup();
      world.activeSceneId = null;

      await service.createCombat({ sceneId: undefined, activate: false });

      expect(world.drafts[0]?.sceneId).toBeUndefined();
    });

    it.each([[null], ['']])('passes a scene of %j on instead of the active scene', async (sceneId) => {
      const { service, world } = setup();

      await service.createCombat({ sceneId, activate: false });

      expect(world.drafts[0]?.sceneId).toBe(sceneId);
    });

    it('asks for activation only when the command does', async () => {
      const { service, world } = setup();

      await service.createCombat({ sceneId: undefined, activate: true });
      await service.createCombat({ sceneId: undefined, activate: false });

      expect(world.drafts.map((draft) => draft.activate)).toEqual([true, false]);
    });

    it('returns the created combat', async () => {
      const created = await setup().service.createCombat({ sceneId: undefined, activate: false });

      expect(created).toMatchObject({ id: 'created', started: false, current: null });
    });

    it('fails when the core created nothing', async () => {
      const { service, world } = setup();
      world.createsNothing = true;

      await expect(service.createCombat({ sceneId: undefined, activate: true })).rejects.toThrow(
        CombatCreationCancelledError
      );
    });
  });

  describe('startCombat', () => {
    it('starts a combat that has not begun and returns its new state', async () => {
      const { service, world } = setup();

      const started = await service.startCombat({ combatId: 'ambush' });

      expect(world.journal).toEqual(['start ambush']);
      expect(started).toMatchObject({ id: 'ambush', started: true, round: 1 });
    });

    it('refuses to start a combat twice', async () => {
      const { service, world } = setup();

      await expect(service.startCombat({ combatId: undefined })).rejects.toThrow(CombatAlreadyStartedError);
      expect(world.journal).toEqual([]);
    });

    it('fails for an unknown combat', async () => {
      await expect(setup().service.startCombat({ combatId: 'missing' })).rejects.toThrow('Combat not found: missing');
    });
  });

  describe('ending and deleting', () => {
    it('ends a combat by deleting it', async () => {
      const { service, world } = setup();

      await service.endCombat({ combatId: undefined });

      expect(world.journal).toEqual(['delete fight']);
    });

    it('deletes the named combat, started or not', async () => {
      const { service, world } = setup();

      await service.deleteCombat({ combatId: 'ambush' });

      expect(world.journal).toEqual(['delete ambush']);
    });

    it.each(['endCombat', 'deleteCombat'] as const)('%s fails without an active combat', async (method) => {
      const { service, world } = setup({ active: null });

      await expect(service[method]({ combatId: undefined })).rejects.toThrow(NoActiveCombatError);
      expect(world.journal).toEqual([]);
    });
  });

  describe('turns', () => {
    it('advances to the next turn and returns the new state', async () => {
      const { service, world } = setup();

      const next = await service.nextTurn({ combatId: undefined });

      expect(world.journal).toEqual(['next fight']);
      expect(next.turn).toBe(1);
    });

    it('goes back to the previous turn', async () => {
      const { service, world } = setup({
        combats: [combat({ id: 'fight', turn: 1, turnOrder: [WIZARD, GOBLIN], current: GOBLIN })]
      });

      const previous = await service.previousTurn({ combatId: 'fight' });

      expect(world.journal).toEqual(['previous fight']);
      expect(previous.turn).toBe(0);
    });

    it.each(['nextTurn', 'previousTurn'] as const)('%s needs a started combat', async (method) => {
      const { service, world } = setup();

      await expect(service[method]({ combatId: 'ambush' })).rejects.toThrow(CombatNotStartedError);
      expect(world.journal).toEqual([]);
    });
  });

  describe('setTurn', () => {
    it('hands the turn to the combatant at its position in the turn order', async () => {
      const { service, world } = setup();

      const state = await service.setTurn({ combatId: undefined, combatantId: 'goblin' });

      expect(world.journal).toEqual(['turn fight 1']);
      expect(state.turn).toBe(1);
    });

    it('can hand it to the first combatant', async () => {
      const { service, world } = setup();

      await service.setTurn({ combatId: 'fight', combatantId: 'wizard' });

      expect(world.journal).toEqual(['turn fight 0']);
    });

    it('needs a started combat, whoever is named', async () => {
      await expect(setup().service.setTurn({ combatId: 'ambush', combatantId: 'goblin' })).rejects.toThrow(
        CombatNotStartedError
      );
    });

    it('rejects a combatant that is not in the turn order', async () => {
      const { service, world } = setup();

      await expect(service.setTurn({ combatId: undefined, combatantId: 'bystander' })).rejects.toThrow(
        CombatantNotInTurnOrderError
      );
      await expect(service.setTurn({ combatId: undefined, combatantId: 'bystander' })).rejects.toThrow(
        'Combatant not found in turn order: bystander'
      );
      expect(world.journal).toEqual([]);
    });
  });
});
