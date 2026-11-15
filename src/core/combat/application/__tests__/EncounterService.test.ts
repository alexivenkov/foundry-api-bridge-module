import { NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import {
  CombatNotFoundError,
  CombatNotStartedError,
  CombatSceneLinkRefusedError,
  NoActiveCombatError,
  type Encounter
} from '../../domain';
import { EncounterService } from '../EncounterService';
import { FakeEncounters, FakeScenes, encounter } from './fakeFeaturePorts';

function setup(
  encounters: readonly Encounter[] = [encounter(), encounter({ id: 'ambush', active: false, isDefault: false })],
  options: { active?: string | null; activeScene?: string | null } = {}
): { service: EncounterService; world: FakeEncounters } {
  const world = new FakeEncounters(encounters, options.active === undefined ? 'fight' : options.active);
  const scenes = new FakeScenes(['crypt', 'tavern'], options.activeScene === undefined ? 'tavern' : options.activeScene);
  return { service: new EncounterService({ combats: world, encounters: world, scenes }), world };
}

describe('EncounterService', () => {
  it('lists every encounter of the world', () => {
    expect(setup().service.listEncounters().map((entry) => entry.id)).toEqual(['fight', 'ambush']);
  });

  describe('activateCombat', () => {
    it('activates the named encounter', async () => {
      const { service, world } = setup();

      const activated = await service.activateCombat({ combatId: 'ambush' });

      expect(world.journal).toEqual(['activate ambush']);
      expect(activated).toMatchObject({ id: 'ambush', active: true });
    });

    it('activates the active combat when none is named', async () => {
      const { service, world } = setup();

      await service.activateCombat({ combatId: undefined });

      expect(world.journal).toEqual(['activate fight']);
    });

    it('fails for an unknown encounter, and without one to default to', async () => {
      await expect(setup().service.activateCombat({ combatId: 'gone' })).rejects.toThrow(
        new CombatNotFoundError('gone')
      );
      await expect(setup(undefined, { active: null }).service.activateCombat({ combatId: undefined })).rejects.toThrow(
        NoActiveCombatError
      );
    });
  });

  describe('toggleSceneLink', () => {
    it('unlinks a linked encounter, whatever scene is named', async () => {
      const { service, world } = setup([encounter({ sceneId: 'crypt' })]);

      const unlinked = await service.toggleSceneLink({ combatId: undefined, sceneId: 'tavern' });

      expect(world.journal).toEqual(['link fight null']);
      expect(unlinked.sceneId).toBeNull();
    });

    it('links an unlinked encounter to the active scene', async () => {
      const { service, world } = setup();

      const linked = await service.toggleSceneLink({ combatId: 'fight', sceneId: undefined });

      expect(world.journal).toEqual(['link fight tavern']);
      expect(linked.sceneId).toBe('tavern');
    });

    it('links it to the scene named', async () => {
      const { service, world } = setup();

      await service.toggleSceneLink({ combatId: 'fight', sceneId: 'crypt' });

      expect(world.journal).toEqual(['link fight crypt']);
    });

    it('refuses to link while a combatant is placed on another scene', async () => {
      const { service, world } = setup([encounter({ combatantSceneIds: ['crypt'] })]);

      await expect(service.toggleSceneLink({ combatId: undefined, sceneId: 'tavern' })).rejects.toThrow(
        new CombatSceneLinkRefusedError('tavern')
      );
      expect(world.journal).toEqual([]);
    });

    it('fails for an unknown scene and without an active one', async () => {
      await expect(setup().service.toggleSceneLink({ combatId: undefined, sceneId: 'moon' })).rejects.toThrow(
        new SceneNotFoundError('moon')
      );
      await expect(
        setup(undefined, { activeScene: null }).service.toggleSceneLink({ combatId: undefined, sceneId: undefined })
      ).rejects.toThrow(NoActiveSceneError);
    });
  });

  describe('rounds', () => {
    it('advance and rewind a started encounter', async () => {
      const { service, world } = setup();

      expect((await service.nextRound({ combatId: undefined })).round).toBe(3);
      expect((await service.previousRound({ combatId: 'fight' })).round).toBe(1);
      expect(world.journal).toEqual(['next-round fight', 'previous-round fight']);
    });

    it('refuse an encounter that has not started', async () => {
      const { service, world } = setup([encounter({ started: false, round: 0 })]);

      await expect(service.nextRound({ combatId: undefined })).rejects.toThrow(CombatNotStartedError);
      await expect(service.previousRound({ combatId: undefined })).rejects.toThrow(CombatNotStartedError);
      expect(world.journal).toEqual([]);
    });
  });

  describe('resetInitiative', () => {
    it('resets the initiative of an encounter, started or not', async () => {
      const { service, world } = setup([encounter({ started: false, round: 0 })]);

      await service.resetInitiative({ combatId: undefined });

      expect(world.journal).toEqual(['reset fight']);
    });

    it('fails for an unknown encounter', async () => {
      await expect(setup().service.resetInitiative({ combatId: 'gone' })).rejects.toThrow(CombatNotFoundError);
    });
  });
});
