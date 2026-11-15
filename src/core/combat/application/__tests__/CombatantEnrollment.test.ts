import {
  CoreFeatureUnavailableError,
  NoActiveSceneError,
  SceneNotFoundError,
  TargetTokenNotFoundError,
  TokenHasNoActorError
} from '../../../shared';
import {
  CombatantGroupNotFoundError,
  CombatantNotFoundError,
  TokenActorMismatchError,
  TokenAlreadyInCombatError,
  type CombatToken
} from '../../domain';
import { CombatantService } from '../CombatantService';
import { FakeCombats, combat, combatant } from './fakePorts';
import { FakeGroups, FakeScenes, FakeTokens, group } from './fakeFeaturePorts';

const WOLF: CombatToken = { id: 'wolf', sceneId: 'crypt', actorId: 'wolf-actor', hidden: true };
const GHOST: CombatToken = { id: 'ghost', sceneId: 'tavern', actorId: null, hidden: false };
const PATRON: CombatToken = { id: 'patron', sceneId: 'tavern', actorId: 'patron-actor', hidden: false };

function setup(options: { linked?: Record<string, string>; activeScene?: string | null } = {}): {
  service: CombatantService;
  world: FakeCombats;
  groups: FakeGroups;
  tokens: FakeTokens;
} {
  const world = new FakeCombats([combat({ id: 'fight', turnOrder: [combatant({ id: 'c1', tokenId: 'hero' })] })]);
  const groups = new FakeGroups({ fight: [group()] });
  const tokens = new FakeTokens([WOLF, GHOST, PATRON], options.linked ?? {});
  const scenes = new FakeScenes(['crypt', 'tavern'], options.activeScene === undefined ? 'tavern' : options.activeScene);
  const service = new CombatantService({
    combats: world,
    combatants: world,
    initiative: world,
    groups,
    scenes,
    tokens
  });
  return { service, world, groups, tokens };
}

describe('CombatantService with tokens and groups', () => {
  describe('adding a token', () => {
    it('looks the token up on the scene named and adds it as the core adds a token', async () => {
      const { service, world } = setup();

      await service.addCombatant({
        combatId: undefined,
        token: { tokenId: 'wolf', sceneId: 'crypt', actorId: undefined, initiative: 11 }
      });

      expect(world.combatantDrafts).toEqual([
        {
          actorId: 'wolf-actor',
          tokenId: 'wolf',
          sceneId: 'crypt',
          initiative: 11,
          hidden: true,
          groupId: undefined
        }
      ]);
    });

    it('looks it up on the scene the encounter is linked to, before the active scene', async () => {
      const { service, tokens } = setup({ linked: { fight: 'crypt' } });

      await service.addCombatant({ combatId: 'fight', token: { tokenId: 'wolf', sceneId: undefined, actorId: undefined } });

      expect(tokens.looked).toEqual(['crypt/wolf']);
    });

    it('looks it up on the active scene when the encounter is linked to none', async () => {
      const { service, tokens, world } = setup();

      await service.addCombatant({
        combatId: undefined,
        token: { tokenId: 'patron', sceneId: undefined, actorId: 'patron-actor', hidden: true }
      });

      expect(tokens.looked).toEqual(['tavern/patron']);
      expect(world.combatantDrafts[0]).toMatchObject({ actorId: 'patron-actor', hidden: true, sceneId: 'tavern' });
    });

    it.each([
      ['an unknown token', { tokenId: 'bear', sceneId: 'crypt', actorId: undefined }, new TargetTokenNotFoundError('bear')],
      ['a token without an actor', { tokenId: 'ghost', sceneId: 'tavern', actorId: undefined }, new TokenHasNoActorError('ghost')],
      [
        'a token of another actor',
        { tokenId: 'wolf', sceneId: 'crypt', actorId: 'bear-actor' },
        new TokenActorMismatchError('wolf', 'bear-actor')
      ],
      ['an unknown scene', { tokenId: 'wolf', sceneId: 'moon', actorId: undefined }, new SceneNotFoundError('moon')]
    ])('refuses %s', async (_case, token, error) => {
      const { service, world } = setup();

      await expect(service.addCombatant({ combatId: undefined, token })).rejects.toThrow(error);
      expect(world.journal).toEqual([]);
    });

    it('refuses a token that is already in the encounter', async () => {
      const { service, world } = setup();
      world.enlist('fight', combatant({ id: 'c2', tokenId: 'wolf' }));

      await expect(
        service.addCombatant({ combatId: undefined, token: { tokenId: 'wolf', sceneId: 'crypt', actorId: undefined } })
      ).rejects.toThrow(new TokenAlreadyInCombatError('wolf'));
    });

    it('needs a scene to look on', async () => {
      const { service } = setup({ activeScene: null });

      await expect(
        service.addCombatant({ combatId: undefined, token: { tokenId: 'wolf', sceneId: undefined, actorId: undefined } })
      ).rejects.toThrow(NoActiveSceneError);
    });
  });

  describe('groups', () => {
    it('put a new combatant in an existing group', async () => {
      const { service, world } = setup();

      await service.addCombatant({ combatId: undefined, draft: { actorId: 'ogre', groupId: 'wolves' } });
      await service.addCombatant({
        combatId: undefined,
        token: { tokenId: 'wolf', sceneId: 'crypt', actorId: undefined, groupId: 'wolves' }
      });

      expect(world.combatantDrafts.map((draft) => draft.groupId)).toEqual(['wolves', 'wolves']);
    });

    it('refuse an unknown group before anything is created', async () => {
      const { service, world } = setup();

      await expect(
        service.addCombatant({ combatId: undefined, draft: { actorId: 'ogre', groupId: 'bears' } })
      ).rejects.toThrow(new CombatantGroupNotFoundError('bears'));
      expect(world.journal).toEqual([]);
    });

    it('move a combatant into a group and out of it', async () => {
      const { service, world } = setup();

      await service.updateCombatant({ combatId: undefined, combatantId: 'c1', changes: { groupId: 'wolves' } });
      await service.updateCombatant({ combatId: undefined, combatantId: 'c1', changes: { groupId: null } });

      expect(world.journal).toEqual(['update fight c1 {"groupId":"wolves"}', 'update fight c1 {"groupId":null}']);
    });

    it('refuse an unknown group for an update, after the combatant is found', async () => {
      const { service } = setup();

      await expect(
        service.updateCombatant({ combatId: undefined, combatantId: 'gone', changes: { groupId: 'bears' } })
      ).rejects.toThrow(CombatantNotFoundError);
      await expect(
        service.updateCombatant({ combatId: undefined, combatantId: 'c1', changes: { groupId: 'bears' } })
      ).rejects.toThrow(new CombatantGroupNotFoundError('bears'));
    });

    it('are refused below Foundry 13, also when clearing', async () => {
      const { service, groups, world } = setup();
      groups.available = false;
      const unavailable = new CoreFeatureUnavailableError('Combatant groups require Foundry 13 or newer');

      await expect(
        service.addCombatant({ combatId: undefined, draft: { actorId: 'ogre', groupId: 'wolves' } })
      ).rejects.toThrow(unavailable);
      await expect(
        service.updateCombatant({ combatId: undefined, combatantId: 'c1', changes: { groupId: null } })
      ).rejects.toThrow(unavailable);
      expect(world.journal).toEqual([]);
    });
  });

  it('cannot look up tokens or groups when built without them', async () => {
    const world = new FakeCombats();
    const service = new CombatantService({ combats: world, combatants: world, initiative: world });

    await expect(
      service.addCombatant({ combatId: undefined, token: { tokenId: 'wolf', sceneId: 'crypt', actorId: undefined } })
    ).rejects.toThrow('CombatantService was built without token lookup');
    await expect(
      service.updateCombatant({ combatId: undefined, combatantId: 'c1', changes: { groupId: 'wolves' } })
    ).rejects.toThrow('CombatantService was built without combatant groups');
  });
});
