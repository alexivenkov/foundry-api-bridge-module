import type { CombatWiring } from '@/core/combat';
import { createActivateCombatHandler } from '../ActivateCombatHandler';
import { createAddCombatantHandler } from '../AddCombatantHandler';
import { createCreateCombatantGroupHandler } from '../CreateCombatantGroupHandler';
import { createDeleteCombatantGroupHandler } from '../DeleteCombatantGroupHandler';
import { createGetCombatTrackerConfigHandler } from '../GetCombatTrackerConfigHandler';
import { createGetCombatantGroupsHandler } from '../GetCombatantGroupsHandler';
import { createGetCombatsHandler } from '../GetCombatsHandler';
import { createNextRoundHandler } from '../NextRoundHandler';
import { createPreviousRoundHandler } from '../PreviousRoundHandler';
import { createResetInitiativeHandler } from '../ResetInitiativeHandler';
import { createToggleCombatSceneLinkHandler } from '../ToggleCombatSceneLinkHandler';
import { createUpdateCombatTrackerConfigHandler } from '../UpdateCombatTrackerConfigHandler';
import { createUpdateCombatantGroupHandler } from '../UpdateCombatantGroupHandler';
import { createUpdateCombatantHandler } from '../UpdateCombatantHandler';

// The new combat commands wired with injected providers instead of the Foundry
// globals. Only the Foundry generation is read from `game.release`.

interface FakeGroup {
  id: string;
  name: string | null | undefined;
  img: string | null;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
  members: Set<{ id: string }>;
  update: jest.Mock;
  delete: jest.Mock;
}

function fakeCombatant(id: string, overrides: Record<string, unknown> = {}) {
  const combatant = {
    id,
    actorId: `${id}-actor`,
    tokenId: `${id}-token`,
    sceneId: null as string | null,
    name: id,
    img: `icons/${id}.webp`,
    initiative: 10 as number | null,
    defeated: false,
    hidden: false,
    token: null,
    group: null as { id: string } | string | null,
    update: jest.fn(),
    ...overrides
  };
  combatant.update.mockImplementation((data: Record<string, unknown>) => {
    Object.assign(combatant, data);
    return Promise.resolve(combatant);
  });
  return combatant;
}

type FakeCombatant = ReturnType<typeof fakeCombatant>;

function fakeGroup(id: string, members: FakeCombatant[] = [], initiative: number | null = null): FakeGroup {
  const group: FakeGroup = {
    id,
    name: 'Wolves',
    img: null,
    initiative,
    defeated: members.every((member) => member.defeated),
    hidden: members.every((member) => member.hidden),
    members: new Set(members),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined)
  };
  group.update.mockImplementation((data: Record<string, unknown>) => {
    Object.assign(group, data);
    return Promise.resolve(group);
  });
  for (const member of members) {
    member.group = group;
  }
  return group;
}

function fakeCombat(id: string, options: { round?: number; scene?: string; combatants?: FakeCombatant[]; groups?: FakeGroup[] } = {}) {
  const combatants = options.combatants ?? [];
  const groups = options.groups ?? [];
  const combat = {
    id,
    round: options.round ?? 1,
    turn: 0,
    get started(): boolean {
      return combat.round > 0;
    },
    active: false,
    scene: options.scene ? { id: options.scene } : null,
    combatant: combatants[0] ?? null,
    combatants: { get: (combatantId: string) => combatants.find((c) => c.id === combatantId), contents: combatants },
    groups: { get: (groupId: string) => groups.find((g) => g.id === groupId), contents: groups },
    turns: combatants,
    startCombat: jest.fn(),
    nextTurn: jest.fn(),
    previousTurn: jest.fn(),
    nextRound: jest.fn(),
    previousRound: jest.fn(),
    resetAll: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn(),
    activate: jest.fn(),
    update: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn(),
    rollInitiative: jest.fn(),
    rollAll: jest.fn(),
    rollNPC: jest.fn(),
    setInitiative: jest.fn()
  };
  combat.activate.mockImplementation(() => {
    combat.active = true;
    return Promise.resolve(combat);
  });
  combat.update.mockImplementation((data: { scene?: string | null }) => {
    if ('scene' in data) {
      combat.scene = data.scene ? { id: data.scene } : null;
    }
    return Promise.resolve(combat);
  });
  combat.nextRound.mockImplementation(() => {
    combat.round += 1;
    return Promise.resolve(combat);
  });
  combat.previousRound.mockImplementation(() => {
    combat.round -= 1;
    return Promise.resolve(combat);
  });
  return combat;
}

type FakeCombat = ReturnType<typeof fakeCombat>;

interface WorldOptions {
  viewed?: FakeCombat | null;
  activeScene?: string;
  tokens?: Record<string, { id: string; actorId: string | null; hidden: boolean }[]>;
  stored?: unknown;
  animations?: string[];
}

function wiringFor(combats: FakeCombat[], options: WorldOptions = {}): CombatWiring & { set: jest.Mock } {
  const viewed = 'viewed' in options ? (options.viewed ?? null) : (combats[0] ?? null);
  const tokens = options.tokens ?? {};
  const scenes = ['crypt', 'tavern'].map((id) => ({
    id,
    name: id,
    tokens: { get: (tokenId: string) => tokens[id]?.find((token) => token.id === tokenId) }
  }));
  let stored = options.stored;
  const set = jest.fn((_namespace: string, _key: string, value: unknown) => {
    stored = value;
    return Promise.resolve(value);
  });
  const world = {
    combat: viewed,
    combats: { get: (id: string) => combats.find((combat) => combat.id === id), contents: combats },
    scenes: {
      active: scenes.find((scene) => scene.id === options.activeScene),
      get: (id: string) => scenes.find((scene) => scene.id === id)
    },
    settings: { get: () => stored, set }
  };
  const legacy = {
    combat: viewed,
    combats: { get: (id: string) => combats.find((combat) => combat.id === id) },
    scenes: { active: undefined, get: () => undefined }
  };
  return {
    gameProvider: { getGame: () => legacy },
    worldProvider: { getGame: () => world },
    combatConfiguration: () =>
      options.animations ? { turnMarkerAnimations: options.animations.map((value) => ({ value })) } : undefined,
    set
  };
}

function onFoundry(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

describe('combat feature handlers', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('get-combats', () => {
    it('lists every encounter, named from Foundry 14 on', async () => {
      onFoundry(14);
      const fight = fakeCombat('fight', { scene: 'crypt', combatants: [fakeCombatant('c1')] });
      const prep = fakeCombat('prep', { round: 0 });
      Object.assign(fight, { name: 'Bridge Ambush', active: true });

      const result = await createGetCombatsHandler(wiringFor([fight, prep]))({});

      expect(result).toEqual({
        combats: [
          {
            id: 'fight',
            sceneId: 'crypt',
            active: true,
            isDefault: true,
            started: true,
            round: 1,
            turn: 0,
            combatantCount: 1,
            name: 'Bridge Ambush'
          },
          {
            id: 'prep',
            sceneId: null,
            active: false,
            isDefault: false,
            started: false,
            round: 0,
            turn: 0,
            combatantCount: 0,
            name: null
          }
        ]
      });
    });

    it('rejects a request that is not an object with an Error', async () => {
      await expect(createGetCombatsHandler(wiringFor([]))('x' as unknown as Record<string, never>)).rejects.toBeInstanceOf(
        Error
      );
    });
  });

  describe('activate-combat', () => {
    it('activates the named encounter and reports it', async () => {
      const ambush = fakeCombat('ambush');

      const result = await createActivateCombatHandler(wiringFor([fakeCombat('fight'), ambush]))({ combatId: 'ambush' });

      expect(ambush.activate).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'ambush', active: true, isDefault: false });
    });

    it('answers not found and rejects a malformed id', async () => {
      const handler = createActivateCombatHandler(wiringFor([fakeCombat('fight')]));

      await expect(handler({ combatId: 'gone' })).rejects.toThrow('Combat not found: gone');
      await expect(handler({ combatId: 7 } as unknown as { combatId: string })).rejects.toThrow('combatId');
    });
  });

  describe('toggle-combat-scene-link', () => {
    it('links an unlinked encounter to the active scene, and unlinks it again', async () => {
      const fight = fakeCombat('fight');
      const handler = createToggleCombatSceneLinkHandler(wiringFor([fight], { activeScene: 'tavern' }));

      await expect(handler({})).resolves.toMatchObject({ sceneId: 'tavern' });
      await expect(handler({ sceneId: 'crypt' })).resolves.toMatchObject({ sceneId: null });
      expect(fight.update.mock.calls).toEqual([[{ scene: 'tavern' }], [{ scene: null }]]);
    });

    it('refuses to link while a combatant is on another scene', async () => {
      const fight = fakeCombat('fight', { combatants: [fakeCombatant('c1', { sceneId: 'crypt' })] });

      await expect(createToggleCombatSceneLinkHandler(wiringFor([fight]))({ sceneId: 'tavern' })).rejects.toThrow(
        'Cannot link the combat to scene tavern: some of its combatants are on another scene'
      );
      expect(fight.update).not.toHaveBeenCalled();
    });

    it('needs a scene to link to', async () => {
      await expect(createToggleCombatSceneLinkHandler(wiringFor([fakeCombat('fight')]))({})).rejects.toThrow(
        'No active scene; specify sceneId'
      );
    });
  });

  describe('next-round, previous-round and reset-initiative', () => {
    it('play the rounds of the active combat and report it as the turn commands do', async () => {
      const fight = fakeCombat('fight', { round: 2, combatants: [fakeCombatant('c1')] });
      const wiring = wiringFor([fight]);

      await expect(createNextRoundHandler(wiring)({})).resolves.toMatchObject({ id: 'fight', round: 3, started: true });
      await expect(createPreviousRoundHandler(wiring)({ combatId: '' })).resolves.toMatchObject({ round: 2 });
    });

    it('refuse a combat that has not started, or none at all', async () => {
      const wiring = wiringFor([fakeCombat('prep', { round: 0 })]);

      await expect(createNextRoundHandler(wiring)({})).rejects.toThrow('Combat not started');
      await expect(createPreviousRoundHandler(wiringFor([], { viewed: null }))({})).rejects.toThrow('No active combat');
    });

    it('reset every initiative through the core', async () => {
      const fight = fakeCombat('fight', { round: 0 });

      await expect(createResetInitiativeHandler(wiringFor([fight]))({ combatId: 'fight' })).resolves.toMatchObject({
        id: 'fight'
      });
      expect(fight.resetAll).toHaveBeenCalled();
    });
  });

  describe('combatant groups', () => {
    it('list the groups of the active combat with their members (Foundry 13+)', async () => {
      onFoundry(13);
      const alpha = fakeCombatant('alpha', { hidden: true });
      const fight = fakeCombat('fight', { combatants: [alpha], groups: [fakeGroup('wolves', [alpha], 14)] });

      await expect(createGetCombatantGroupsHandler(wiringFor([fight]))({})).resolves.toEqual({
        combatId: 'fight',
        groups: [
          { id: 'wolves', name: 'Wolves', img: null, initiative: 14, defeated: false, hidden: true, memberIds: ['alpha'] }
        ]
      });
    });

    it('are refused below Foundry 13', async () => {
      onFoundry(12);

      await expect(createGetCombatantGroupsHandler(wiringFor([fakeCombat('fight')]))({})).rejects.toThrow(
        'Combatant groups require Foundry 13 or newer'
      );
    });

    it('create a group and report it with its combat', async () => {
      onFoundry(14);
      const fight = fakeCombat('fight');
      const created = fakeGroup('bandits');
      created.name = 'Bandits';
      fight.createEmbeddedDocuments.mockResolvedValue([created]);

      const result = await createCreateCombatantGroupHandler(wiringFor([fight]))({ name: 'Bandits', img: 'icons/b.png' });

      expect(fight.createEmbeddedDocuments).toHaveBeenCalledWith('CombatantGroup', [{ name: 'Bandits', img: 'icons/b.png' }]);
      expect(result).toMatchObject({ combatId: 'fight', id: 'bandits', name: 'Bandits', memberIds: [] });
    });

    it('reject a group image that is not an image', async () => {
      onFoundry(13);

      await expect(
        createCreateCombatantGroupHandler(wiringFor([fakeCombat('fight')]))({ img: 'notes.txt' })
      ).rejects.toThrow('img');
    });

    it('update a group, a null name stored blank', async () => {
      onFoundry(13);
      const wolves = fakeGroup('wolves');
      const fight = fakeCombat('fight', { groups: [wolves] });

      const result = await createUpdateCombatantGroupHandler(wiringFor([fight]))({ groupId: 'wolves', name: null, initiative: 8 });

      expect(wolves.update).toHaveBeenCalledWith({ name: '', initiative: 8 });
      expect(result).toMatchObject({ combatId: 'fight', id: 'wolves', name: null, initiative: 8 });
    });

    it('delete a group and answer not found for an unknown one', async () => {
      onFoundry(13);
      const wolves = fakeGroup('wolves');
      const handler = createDeleteCombatantGroupHandler(wiringFor([fakeCombat('fight', { groups: [wolves] })]));

      await expect(handler({ groupId: 'wolves' })).resolves.toEqual({ deleted: true, groupId: 'wolves', combatId: 'fight' });
      expect(wolves.delete).toHaveBeenCalled();
      await expect(handler({ groupId: 'bears' })).rejects.toThrow('Combatant group not found: bears');
    });
  });

  describe('combat tracker configuration', () => {
    const stored = {
      resource: '',
      skipDefeated: false,
      turnMarker: { enabled: true, animation: 'spin', src: '', disposition: false }
    };

    it('reads the configuration with the known animations (Foundry 13+)', async () => {
      onFoundry(13);

      await expect(
        createGetCombatTrackerConfigHandler(wiringFor([], { stored, animations: ['spin', 'pulse'] }))({})
      ).resolves.toEqual({
        resource: null,
        skipDefeated: false,
        turnMarker: { enabled: true, animation: 'spin', src: null, disposition: false },
        turnMarkerAnimations: ['spin', 'pulse']
      });
    });

    it('reads only the resource and the skip flag before Foundry 13', async () => {
      onFoundry(12);

      await expect(createGetCombatTrackerConfigHandler(wiringFor([], { stored: {} }))({})).resolves.toEqual({
        resource: null,
        skipDefeated: false
      });
    });

    it('stores the whole value with the changes merged in', async () => {
      onFoundry(14);
      const wiring = wiringFor([], { stored, animations: ['spin', 'pulse'] });

      const result = await createUpdateCombatTrackerConfigHandler(wiring)({
        resource: 'attributes.hp.value',
        turnMarker: { animation: 'pulse' }
      });

      expect(wiring.set).toHaveBeenCalledWith('core', 'combatTrackerConfig', {
        resource: 'attributes.hp.value',
        skipDefeated: false,
        turnMarker: { enabled: true, animation: 'pulse', src: '', disposition: false }
      });
      expect(result.turnMarker?.animation).toBe('pulse');
    });

    it('refuses an unknown animation and a malformed resource', async () => {
      onFoundry(13);
      const handler = createUpdateCombatTrackerConfigHandler(wiringFor([], { stored, animations: ['spin'] }));

      await expect(handler({ turnMarker: { animation: 'wobble' } })).rejects.toThrow(
        'Unknown turn marker animation: wobble (known: spin)'
      );
      await expect(handler({ resource: 'hit points' })).rejects.toThrow('resource');
    });
  });

  describe('add-combatant with a token or a group', () => {
    const tokens = { crypt: [{ id: 'wolf', actorId: 'wolf-actor', hidden: true }] };

    it('adds a token looked up on its scene with the payload the core uses', async () => {
      onFoundry(13);
      const fight = fakeCombat('fight', { groups: [fakeGroup('pack')] });
      fight.createEmbeddedDocuments.mockResolvedValue([fakeCombatant('added', { group: fight.groups.contents[0] })]);

      const result = await createAddCombatantHandler(wiringFor([fight], { tokens }))({
        tokenId: 'wolf',
        sceneId: 'crypt',
        groupId: 'pack'
      });

      expect(fight.createEmbeddedDocuments).toHaveBeenCalledWith('Combatant', [
        { actorId: 'wolf-actor', tokenId: 'wolf', sceneId: 'crypt', hidden: true, group: 'pack' }
      ]);
      expect(result).toMatchObject({ id: 'added', groupId: 'pack' });
    });

    it('looks the token up on the encounter scene when none is named', async () => {
      const fight = fakeCombat('fight', { scene: 'crypt' });
      fight.createEmbeddedDocuments.mockResolvedValue([fakeCombatant('added')]);

      await createAddCombatantHandler(wiringFor([fight], { tokens }))({ tokenId: 'wolf', hidden: false });

      expect(fight.createEmbeddedDocuments).toHaveBeenCalledWith('Combatant', [
        { actorId: 'wolf-actor', tokenId: 'wolf', sceneId: 'crypt', hidden: false }
      ]);
    });

    it('answers not found for a token that is not on the scene', async () => {
      const fight = fakeCombat('fight');

      await expect(
        createAddCombatantHandler(wiringFor([fight], { tokens }))({ tokenId: 'bear', sceneId: 'crypt' })
      ).rejects.toThrow('Token not found: bear');
      expect(fight.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('refuses a token already in the encounter', async () => {
      const fight = fakeCombat('fight', { combatants: [fakeCombatant('c1', { tokenId: 'wolf' })] });

      await expect(
        createAddCombatantHandler(wiringFor([fight], { tokens }))({ tokenId: 'wolf', sceneId: 'crypt' })
      ).rejects.toThrow('Token is already in the combat: wolf');
    });

    it('rejects a request with neither an actor nor a token', async () => {
      await expect(createAddCombatantHandler(wiringFor([fakeCombat('fight')]))({} as never)).rejects.toThrow(
        'actorId or tokenId is required'
      );
    });
  });

  describe('update-combatant with a group', () => {
    it('moves the combatant into a group and reports the group it is in', async () => {
      onFoundry(13);
      const alpha = fakeCombatant('alpha');
      const pack = fakeGroup('pack');
      const fight = fakeCombat('fight', { combatants: [alpha], groups: [pack] });
      alpha.update.mockImplementation((data: { group?: string | null }) => {
        alpha.group = data.group === 'pack' ? pack : null;
        return Promise.resolve(alpha);
      });

      const result = await createUpdateCombatantHandler(wiringFor([fight]))({ combatantId: 'alpha', groupId: 'pack' });

      expect(alpha.update).toHaveBeenCalledWith({ group: 'pack' });
      expect(result.groupId).toBe('pack');
    });

    it('answers not found for an unknown group, and refuses groups below Foundry 13', async () => {
      onFoundry(13);
      const fight = fakeCombat('fight', { combatants: [fakeCombatant('alpha')] });
      const handler = createUpdateCombatantHandler(wiringFor([fight]));

      await expect(handler({ combatantId: 'alpha', groupId: 'bears' })).rejects.toThrow('Combatant group not found: bears');
      onFoundry(12);
      await expect(handler({ combatantId: 'alpha', groupId: null })).rejects.toThrow(
        'Combatant groups require Foundry 13 or newer'
      );
    });
  });
});
