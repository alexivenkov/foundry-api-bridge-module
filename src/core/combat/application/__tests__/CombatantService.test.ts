import {
  CombatantCreationFailedError,
  CombatantLostError,
  CombatantNotFoundError,
  NoActiveCombatError,
  NoCombatantIdsError,
  type Combat
} from '../../domain';
import { CombatantService } from '../CombatantService';
import { FakeCombats, combat, combatant } from './fakePorts';

const FIGHTER = combatant({ id: 'fighter', name: 'Fighter', initiative: 15 });
const NPC_GOBLIN = combatant({ id: 'goblin', name: 'NPC Goblin', initiative: null, hidden: true });
const WIZARD = combatant({ id: 'wizard', name: 'Wizard', initiative: null });

function setup(options: { combats?: readonly Combat[]; active?: string | null } = {}): {
  service: CombatantService;
  world: FakeCombats;
} {
  const combats = options.combats ?? [
    combat({ id: 'fight', turnOrder: [FIGHTER, NPC_GOBLIN, WIZARD] }),
    combat({ id: 'empty', round: 0, started: false, turnOrder: [], current: null })
  ];
  const world = new FakeCombats(combats, options.active === undefined ? 'fight' : options.active);
  return { service: new CombatantService({ combats: world, combatants: world, initiative: world }), world };
}

describe('CombatantService', () => {
  describe('addCombatant', () => {
    it('adds the combatant to the active combat', async () => {
      const { service, world } = setup();
      const draft = { actorId: 'ogre', tokenId: 'ogre-token', initiative: 9, hidden: true };

      const added = await service.addCombatant({ combatId: undefined, draft });

      expect(world.journal).toEqual(['add fight']);
      expect(world.combatantDrafts).toEqual([draft]);
      expect(added).toMatchObject({ id: 'added', actorId: 'ogre', tokenId: 'ogre-token' });
    });

    it('adds it to the named combat', async () => {
      const { service, world } = setup();

      await service.addCombatant({ combatId: 'empty', draft: { actorId: 'ogre' } });

      expect(world.journal).toEqual(['add empty']);
    });

    it('fails when the core created nothing', async () => {
      const { service, world } = setup();
      world.addsNothing = true;

      await expect(service.addCombatant({ combatId: undefined, draft: { actorId: 'ogre' } })).rejects.toThrow(
        CombatantCreationFailedError
      );
    });

    it('fails without an active combat', async () => {
      const { service, world } = setup({ active: null });

      await expect(service.addCombatant({ combatId: undefined, draft: { actorId: 'ogre' } })).rejects.toThrow(
        NoActiveCombatError
      );
      expect(world.journal).toEqual([]);
    });
  });

  describe('removeCombatant', () => {
    it('removes a combatant of the combat', async () => {
      const { service, world } = setup();

      await service.removeCombatant({ combatId: undefined, combatantId: 'goblin' });

      expect(world.journal).toEqual(['remove fight goblin']);
    });

    it('rejects a combatant the combat does not have', async () => {
      const { service, world } = setup();

      await expect(service.removeCombatant({ combatId: 'empty', combatantId: 'goblin' })).rejects.toThrow(
        'Combatant not found: goblin'
      );
      expect(world.journal).toEqual([]);
    });
  });

  describe('updateCombatant', () => {
    it('applies the named attributes and returns the combatant as it is afterwards', async () => {
      const { service, world } = setup();

      const updated = await service.updateCombatant({
        combatId: undefined,
        combatantId: 'fighter',
        changes: { initiative: 20, defeated: true }
      });

      expect(world.journal).toEqual(['update fight fighter {"initiative":20,"defeated":true}']);
      expect(updated).toMatchObject({ id: 'fighter', initiative: 20, defeated: true, hidden: false });
    });

    it('clears the initiative with null', async () => {
      const { service } = setup();

      const updated = await service.updateCombatant({
        combatId: undefined,
        combatantId: 'fighter',
        changes: { initiative: null }
      });

      expect(updated.initiative).toBeNull();
    });

    it('returns the combatant untouched when no attribute is named', async () => {
      const { service, world } = setup();

      const same = await service.updateCombatant({
        combatId: undefined,
        combatantId: 'fighter',
        changes: { initiative: undefined, defeated: undefined, hidden: undefined }
      });

      expect(same).toEqual(FIGHTER);
      expect(world.journal).toEqual([]);
    });

    it('rejects an unknown combatant, with or without changes', async () => {
      const { service } = setup();

      await expect(
        service.updateCombatant({ combatId: undefined, combatantId: 'ghost', changes: {} })
      ).rejects.toThrow(CombatantNotFoundError);
      await expect(
        service.updateCombatant({ combatId: undefined, combatantId: 'ghost', changes: { hidden: true } })
      ).rejects.toThrow('Combatant not found: ghost');
    });

    it('reports a combatant that left the combat while it was updated', async () => {
      const { service, world } = setup();
      world.losesCombatantOnUpdate = true;

      await expect(
        service.updateCombatant({ combatId: undefined, combatantId: 'fighter', changes: { hidden: true } })
      ).rejects.toThrow(CombatantNotFoundError);
    });
  });

  describe('setDefeated', () => {
    it.each([true, false])('sets nothing but the defeated flag (%s), even when it is already so', async (defeated) => {
      const { service, world } = setup();

      const updated = await service.setDefeated({ combatId: undefined, combatantId: 'fighter', defeated });

      expect(world.journal).toEqual([`update fight fighter {"defeated":${String(defeated)}}`]);
      expect(updated.defeated).toBe(defeated);
    });

    it('rejects an unknown combatant', async () => {
      await expect(
        setup().service.setDefeated({ combatId: undefined, combatantId: 'ghost', defeated: true })
      ).rejects.toThrow(CombatantNotFoundError);
    });
  });

  describe('toggleVisibility', () => {
    it('hides a visible combatant', async () => {
      const { service, world } = setup();

      const updated = await service.toggleVisibility({ combatId: undefined, combatantId: 'fighter' });

      expect(world.journal).toEqual(['update fight fighter {"hidden":true}']);
      expect(updated.hidden).toBe(true);
    });

    it('reveals a hidden one', async () => {
      const { service, world } = setup();

      const updated = await service.toggleVisibility({ combatId: undefined, combatantId: 'goblin' });

      expect(world.journal).toEqual(['update fight goblin {"hidden":false}']);
      expect(updated.hidden).toBe(false);
    });

    it('rejects an unknown combatant', async () => {
      await expect(setup().service.toggleVisibility({ combatId: undefined, combatantId: 'ghost' })).rejects.toThrow(
        'Combatant not found: ghost'
      );
    });
  });

  describe('setInitiative', () => {
    it('sets the initiative and returns the combatant as it is afterwards', async () => {
      const { service, world } = setup();

      const updated = await service.setInitiative({ combatId: undefined, combatantId: 'wizard', initiative: 21 });

      expect(world.journal).toEqual(['initiative fight wizard 21']);
      expect(updated).toMatchObject({ id: 'wizard', initiative: 21 });
    });

    it('clears it with null', async () => {
      const { service, world } = setup();

      const updated = await service.setInitiative({ combatId: undefined, combatantId: 'fighter', initiative: null });

      expect(world.journal).toEqual(['initiative fight fighter null']);
      expect(updated.initiative).toBeNull();
    });

    it('rejects an unknown combatant before touching anything', async () => {
      const { service, world } = setup();

      await expect(
        service.setInitiative({ combatId: undefined, combatantId: 'ghost', initiative: 3 })
      ).rejects.toThrow(CombatantNotFoundError);
      expect(world.journal).toEqual([]);
    });

    it('fails when the combatant is gone once the initiative is set', async () => {
      const { service, world } = setup();
      world.losesCombatantOnInitiative = true;

      await expect(
        service.setInitiative({ combatId: undefined, combatantId: 'wizard', initiative: 3 })
      ).rejects.toThrow(CombatantLostError);
    });
  });

  describe('rollInitiative', () => {
    it('rolls for the named combatants and reports them in the order asked', async () => {
      const { service, world } = setup();

      const scores = await service.rollInitiative({
        combatId: undefined,
        combatantIds: ['wizard', 'goblin'],
        options: {}
      });

      expect(world.journal).toEqual(['roll fight wizard,goblin {}']);
      expect(scores).toEqual([
        { combatantId: 'wizard', name: 'Wizard', initiative: 17 },
        { combatantId: 'goblin', name: 'NPC Goblin', initiative: 17 }
      ]);
    });

    it('passes a custom formula on', async () => {
      const { service, world } = setup();

      await service.rollInitiative({ combatId: 'fight', combatantIds: ['wizard'], options: { formula: '2d6+5' } });

      expect(world.journal).toEqual(['roll fight wizard {"formula":"2d6+5"}']);
    });

    it('needs at least one combatant', async () => {
      await expect(
        setup().service.rollInitiative({ combatId: undefined, combatantIds: [], options: {} })
      ).rejects.toThrow(NoCombatantIdsError);
    });

    it('looks for the combat before it looks at the list', async () => {
      await expect(
        setup({ active: null }).service.rollInitiative({ combatId: undefined, combatantIds: [], options: {} })
      ).rejects.toThrow(NoActiveCombatError);
    });

    it('rolls for no one when one of the combatants is unknown', async () => {
      const { service, world } = setup();

      await expect(
        service.rollInitiative({ combatId: undefined, combatantIds: ['wizard', 'ghost'], options: {} })
      ).rejects.toThrow('Combatant not found: ghost');
      expect(world.journal).toEqual([]);
    });
  });

  describe('rollAllInitiative', () => {
    it('rolls for everyone without initiative and reports those it rolled for', async () => {
      const { service, world } = setup();

      const scores = await service.rollAllInitiative({ combatId: undefined, npcsOnly: false, options: {} });

      expect(world.journal).toEqual(['roll-all fight {}']);
      expect(scores).toEqual([
        { combatantId: 'goblin', name: 'NPC Goblin', initiative: 17 },
        { combatantId: 'wizard', name: 'Wizard', initiative: 17 }
      ]);
    });

    it('does not report a combatant that had already rolled', async () => {
      const { service } = setup();

      const scores = await service.rollAllInitiative({ combatId: undefined, npcsOnly: false, options: {} });

      expect(scores.map((score) => score.combatantId)).not.toContain('fighter');
    });

    it('rolls for the non-player combatants only when asked to, and reports them alone', async () => {
      const { service, world } = setup();

      const scores = await service.rollAllInitiative({
        combatId: undefined,
        npcsOnly: true,
        options: { formula: '1d20' }
      });

      expect(world.journal).toEqual(['roll-npcs fight {"formula":"1d20"}']);
      expect(scores).toEqual([{ combatantId: 'goblin', name: 'NPC Goblin', initiative: 17 }]);
    });

    it('still rolls when everyone has an initiative, and reports no one', async () => {
      const everyoneRolled = combat({
        id: 'fight',
        turnOrder: [FIGHTER, combatant({ id: 'ogre', name: 'NPC Ogre', initiative: 4 })]
      });
      const { service, world } = setup({ combats: [everyoneRolled] });

      const scores = await service.rollAllInitiative({ combatId: undefined, npcsOnly: true, options: {} });

      expect(world.journal).toEqual(['roll-npcs fight {}']);
      expect(scores).toEqual([]);
    });

    it('rolls nothing in a combat without combatants', async () => {
      const { service, world } = setup();

      const scores = await service.rollAllInitiative({ combatId: 'empty', npcsOnly: false, options: {} });

      expect(scores).toEqual([]);
      expect(world.journal).toEqual([]);
    });

    it('fails without an active combat', async () => {
      await expect(
        setup({ active: null }).service.rollAllInitiative({ combatId: undefined, npcsOnly: false, options: {} })
      ).rejects.toThrow(NoActiveCombatError);
    });
  });
});
