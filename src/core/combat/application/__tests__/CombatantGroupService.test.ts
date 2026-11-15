import { CoreFeatureUnavailableError } from '../../../shared';
import {
  CombatNotFoundError,
  CombatantGroupCreationFailedError,
  CombatantGroupNotFoundError,
  NoActiveCombatError
} from '../../domain';
import { CombatantGroupService } from '../CombatantGroupService';
import { FakeEncounters, FakeGroups, encounter, group } from './fakeFeaturePorts';

function setup(options: { active?: string | null } = {}): { service: CombatantGroupService; groups: FakeGroups } {
  const combats = new FakeEncounters(
    [encounter(), encounter({ id: 'ambush' })],
    options.active === undefined ? 'fight' : options.active
  );
  const groups = new FakeGroups({ fight: [group({ memberIds: ['c1'] })], ambush: [] });
  return { service: new CombatantGroupService({ combats, groups }), groups };
}

describe('CombatantGroupService', () => {
  it('lists the groups of the active combat, with the combat they belong to', () => {
    expect(setup().service.listGroups({ combatId: undefined })).toEqual({
      combatId: 'fight',
      groups: [group({ memberIds: ['c1'] })]
    });
  });

  it('lists the groups of the named combat', () => {
    expect(setup().service.listGroups({ combatId: 'ambush' })).toEqual({ combatId: 'ambush', groups: [] });
  });

  it.each([
    ['listing', (service: CombatantGroupService) => Promise.resolve().then(() => service.listGroups({ combatId: undefined }))],
    ['creating', (service: CombatantGroupService) => service.createGroup({ combatId: undefined, draft: {} })],
    [
      'updating',
      (service: CombatantGroupService) =>
        service.updateGroup({ combatId: undefined, groupId: 'wolves', changes: { name: 'x' } })
    ],
    ['deleting', (service: CombatantGroupService) => service.deleteGroup({ combatId: undefined, groupId: 'wolves' })]
  ])('refuses %s below Foundry 13, before looking for a combat', async (_case, act) => {
    const { service, groups } = setup({ active: null });
    groups.available = false;

    await expect(act(service)).rejects.toThrow(
      new CoreFeatureUnavailableError('Combatant groups require Foundry 13 or newer')
    );
    expect(groups.journal).toEqual([]);
  });

  it('fails without an active combat and for an unknown one', async () => {
    expect(() => setup({ active: null }).service.listGroups({ combatId: undefined })).toThrow(NoActiveCombatError);
    await expect(setup().service.createGroup({ combatId: 'gone', draft: {} })).rejects.toThrow(
      new CombatNotFoundError('gone')
    );
  });

  describe('createGroup', () => {
    it('creates a group in the combat', async () => {
      const { service, groups } = setup();

      const outcome = await service.createGroup({
        combatId: 'ambush',
        draft: { name: 'Bandits', img: 'icons/bandit.webp', initiative: 12 }
      });

      expect(groups.journal).toEqual(['create ambush {"name":"Bandits","img":"icons/bandit.webp","initiative":12}']);
      expect(outcome).toEqual({
        combatId: 'ambush',
        group: group({ id: 'created', name: 'Bandits', img: 'icons/bandit.webp', initiative: 12 })
      });
    });

    it('fails when the core created nothing', async () => {
      const { service, groups } = setup();
      groups.createsNothing = true;

      await expect(service.createGroup({ combatId: undefined, draft: {} })).rejects.toThrow(
        CombatantGroupCreationFailedError
      );
    });
  });

  describe('updateGroup', () => {
    it('applies the changes', async () => {
      const { service, groups } = setup();

      const outcome = await service.updateGroup({
        combatId: undefined,
        groupId: 'wolves',
        changes: { name: null, initiative: 7 }
      });

      expect(groups.journal).toEqual(['update fight wolves {"name":null,"initiative":7}']);
      expect(outcome.group).toMatchObject({ name: null, initiative: 7 });
    });

    it('sends nothing for an update that names no attribute', async () => {
      const { service, groups } = setup();

      const outcome = await service.updateGroup({ combatId: undefined, groupId: 'wolves', changes: {} });

      expect(groups.journal).toEqual([]);
      expect(outcome).toEqual({ combatId: 'fight', group: group({ memberIds: ['c1'] }) });
    });

    it('fails for an unknown group, and for one gone during the update', async () => {
      const { service, groups } = setup();

      await expect(
        service.updateGroup({ combatId: undefined, groupId: 'bears', changes: { name: 'x' } })
      ).rejects.toThrow(new CombatantGroupNotFoundError('bears'));

      groups.losesGroupOnUpdate = true;
      await expect(
        service.updateGroup({ combatId: undefined, groupId: 'wolves', changes: { name: 'x' } })
      ).rejects.toThrow(new CombatantGroupNotFoundError('wolves'));
    });
  });

  describe('deleteGroup', () => {
    it('deletes the group and reports where', async () => {
      const { service, groups } = setup();

      expect(await service.deleteGroup({ combatId: undefined, groupId: 'wolves' })).toEqual({
        combatId: 'fight',
        groupId: 'wolves'
      });
      expect(groups.journal).toEqual(['delete fight wolves']);
    });

    it('fails for an unknown group without deleting anything', async () => {
      const { service, groups } = setup();

      await expect(service.deleteGroup({ combatId: 'ambush', groupId: 'wolves' })).rejects.toThrow(
        CombatantGroupNotFoundError
      );
      expect(groups.journal).toEqual([]);
    });
  });
});
