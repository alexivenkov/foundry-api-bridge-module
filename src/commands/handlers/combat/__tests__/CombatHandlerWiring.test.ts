import type { CombatWiring } from '@/core/combat';
import { createAddCombatantHandler } from '../AddCombatantHandler';
import { createCreateCombatHandler } from '../CreateCombatHandler';
import { createGetCombatStateHandler } from '../GetCombatStateHandler';
import { createGetCombatTurnContextHandler } from '../GetCombatTurnContextHandler';
import { createRollAllInitiativeHandler } from '../RollAllInitiativeHandler';
import { createUpdateCombatantHandler } from '../UpdateCombatantHandler';

// The handlers wired with their own providers instead of the Foundry globals,
// and the wire details the pre-migration tests do not pin down.

interface FakeCombatant {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
  img: string;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
  token: { parent: { id: string } | null } | null;
  update: jest.Mock;
}

function fakeCombatant(overrides: Partial<FakeCombatant> = {}): FakeCombatant {
  return {
    id: 'c1',
    actorId: 'a1',
    tokenId: 't1',
    name: 'Fighter',
    img: 'icons/fighter.webp',
    initiative: 15,
    defeated: false,
    hidden: false,
    token: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function fakeCombat(id: string, combatants: FakeCombatant[], current: FakeCombatant | null = null) {
  return {
    id,
    round: 2,
    turn: 0,
    started: true,
    combatant: current,
    combatants: { get: (combatantId: string) => combatants.find((c) => c.id === combatantId), contents: combatants },
    turns: combatants,
    startCombat: jest.fn(),
    nextTurn: jest.fn(),
    previousTurn: jest.fn(),
    delete: jest.fn(),
    activate: jest.fn().mockResolvedValue(undefined),
    update: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn(),
    rollInitiative: jest.fn(),
    rollAll: jest.fn().mockResolvedValue(undefined),
    rollNPC: jest.fn().mockResolvedValue(undefined),
    setInitiative: jest.fn()
  };
}

type FakeCombat = ReturnType<typeof fakeCombat>;

type FakeScene = ReturnType<typeof fakeScene>;

function fakeScene(id: string, name: string, tokens: unknown[]) {
  return {
    id,
    name,
    grid: { size: 100, distance: 5, units: 'ft' },
    tokens: { contents: tokens as never[] },
    walls: { contents: [] }
  };
}

function wiringFor(viewed: FakeCombat | null, others: FakeCombat[] = [], scenes: FakeScene[] = []): CombatWiring {
  const game = {
    combat: viewed,
    combats: { get: (id: string) => others.find((combat) => combat.id === id) },
    scenes: { active: undefined, get: (id: string) => scenes.find((scene) => scene.id === id) }
  };
  return { gameProvider: { getGame: () => game } };
}

describe('combat handlers with injected providers', () => {
  it('never touch the Foundry globals', async () => {
    const fighter = fakeCombatant();
    const handler = createGetCombatStateHandler(wiringFor(fakeCombat('fight', [fighter], fighter)));

    expect('game' in globalThis).toBe(false);
    await expect(handler({})).resolves.toMatchObject({ id: 'fight', round: 2, current: { id: 'c1' } });
  });

  it.each([[''], [null], [undefined]])('read a combatId of %j as the active combat', async (combatId) => {
    const handler = createGetCombatStateHandler(wiringFor(fakeCombat('shown', []), [fakeCombat('other', [])]));

    await expect(handler({ combatId } as { combatId?: string })).resolves.toMatchObject({ id: 'shown' });
  });

  it('reject a malformed request with an Error object', async () => {
    const handler = createGetCombatStateHandler(wiringFor(fakeCombat('fight', [])));

    await expect(handler({ combatId: 7 } as unknown as { combatId?: string })).rejects.toBeInstanceOf(Error);
  });

  it('create a combat without a scene when the core reports no active scene as undefined', async () => {
    const create = jest.fn().mockResolvedValue(fakeCombat('new', []));
    const handler = createCreateCombatHandler({ ...wiringFor(null), combatClass: () => ({ create }) });

    await handler({});

    expect(create).toHaveBeenCalledWith({});
  });

  it('add a combatant with the payload keys in the order they have always had', async () => {
    const combat = fakeCombat('fight', []);
    combat.createEmbeddedDocuments.mockResolvedValue([fakeCombatant()]);
    const handler = createAddCombatantHandler(wiringFor(combat));

    await handler({ hidden: true, initiative: 3, tokenId: 't9', actorId: 'a9' });

    const [, [data]] = combat.createEmbeddedDocuments.mock.calls[0] as [string, [Record<string, unknown>]];
    expect(Object.entries(data)).toEqual([
      ['actorId', 'a9'],
      ['tokenId', 't9'],
      ['initiative', 3],
      ['hidden', true]
    ]);
  });

  it('apply the changes the REST API sends nested in `updates` with update-combatant', async () => {
    const fighter = fakeCombatant();
    const handler = createUpdateCombatantHandler(wiringFor(fakeCombat('fight', [fighter])));

    await handler({ combatantId: 'c1', updates: { initiative: 20, defeated: true } });

    expect(fighter.update).toHaveBeenCalledWith({ initiative: 20, defeated: true });
  });

  it('let a top-level change win over the same field in `updates`', async () => {
    const fighter = fakeCombatant();
    const handler = createUpdateCombatantHandler(wiringFor(fakeCombat('fight', [fighter])));

    await handler({ combatantId: 'c1', initiative: 7, updates: { initiative: 20, hidden: true } });

    expect(fighter.update).toHaveBeenCalledWith({ initiative: 7, hidden: true });
  });

  it('never fail update-combatant over what `updates` holds', async () => {
    const fighter = fakeCombatant();
    const handler = createUpdateCombatantHandler(wiringFor(fakeCombat('fight', [fighter])));
    const junk = { combatantId: 'c1', updates: { initiative: 'high', flags: { x: 1 } } } as unknown as Parameters<typeof handler>[0];

    await expect(handler(junk)).resolves.toMatchObject({ id: 'c1' });
    await expect(handler({ combatantId: 'c1', updates: 'none' } as unknown as Parameters<typeof handler>[0]))
      .resolves.toMatchObject({ id: 'c1' });
    expect(fighter.update).not.toHaveBeenCalled();
  });

  it('report from roll-all-initiative only the combatants the call rolled for', async () => {
    const rolled = fakeCombatant({ id: 'c1', name: 'Fighter', initiative: 15 });
    const unrolled = fakeCombatant({ id: 'c2', name: 'Wizard', initiative: null });
    const skipped = fakeCombatant({ id: 'c3', name: 'Rogue', initiative: null });
    const combat = fakeCombat('fight', [rolled, unrolled, skipped]);
    combat.rollAll.mockImplementation(() => {
      unrolled.initiative = 9;
      return Promise.resolve(combat);
    });

    const result = await createRollAllInitiativeHandler(wiringFor(combat))({});

    expect(result).toEqual({ results: [{ combatantId: 'c2', name: 'Wizard', initiative: 9 }] });
  });

  it.each([[1], ['yes']])('roll for the non-player combatants on a truthy npcsOnly of %j', async (npcsOnly) => {
    const combat = fakeCombat('fight', [fakeCombatant()]);
    const handler = createRollAllInitiativeHandler(wiringFor(combat));

    await handler({ npcsOnly } as unknown as { npcsOnly?: boolean });

    expect(combat.rollNPC).toHaveBeenCalledWith({});
    expect(combat.rollAll).not.toHaveBeenCalled();
  });
});

describe('get-combat-turn-context on the wire', () => {
  const hero = fakeCombatant({ id: 'c-hero', actorId: 'a-hero', tokenId: 'hero', name: 'Hero' });
  const spy = fakeCombatant({ id: 'c-spy', actorId: 'a-spy', tokenId: 'spy', name: 'Spy' });
  const cart = fakeCombatant({ id: 'c-cart', actorId: 'a-cart', tokenId: 'cart', name: 'Cart' });

  function contextHandler(tokens: unknown[]) {
    const combat = { ...fakeCombat('fight', [hero, spy, cart], hero), round: 4, turn: 2 };
    return createGetCombatTurnContextHandler({
      ...wiringFor(combat),
      canvasGlobals: () => ({
        canvas: { scene: fakeScene('docks', 'Docks', tokens) },
        CONFIG: { Canvas: { polygonBackends: { move: { testCollision: () => false } } } }
      })
    });
  }

  const heroToken = {
    id: 'hero',
    name: 'Hero',
    x: 200,
    y: 200,
    width: 1,
    height: 1,
    disposition: 1,
    actor: {
      id: 'a-hero',
      system: { attributes: { hp: { value: 0, max: 30 }, ac: { value: 0 } } },
      statuses: new Set(['prone'])
    }
  };

  it('reports the current combatant with its keys in their usual order, zero hit points and armor included', async () => {
    const result = await contextHandler([heroToken])({});

    expect(Object.entries(result.currentCombatant)).toEqual([
      ['id', 'c-hero'],
      ['actorId', 'a-hero'],
      ['tokenId', 'hero'],
      ['name', 'Hero'],
      ['gridX', 2],
      ['gridY', 2],
      ['conditions', ['prone']],
      ['hp', { value: 0, max: 30 }],
      ['ac', 0]
    ]);
    expect(result).toMatchObject({ round: 4, turn: 2, nearbyTokens: [] });
  });

  it('leaves hp and ac out, rather than null, for an actor whose system does not expose them', async () => {
    const cartToken = { id: 'cart', name: 'Cart', x: 300, y: 200, width: 2, height: 1, disposition: 0, actor: { id: 'a-cart', system: {} } };

    const { nearbyTokens } = await contextHandler([heroToken, cartToken])({});

    expect(nearbyTokens).toHaveLength(1);
    expect(Object.keys(nearbyTokens[0] ?? {})).toEqual([
      'tokenId',
      'actorId',
      'name',
      'gridX',
      'gridY',
      'distanceFt',
      'disposition',
      'lineOfSight',
      'conditions'
    ]);
  });

  it('reports a secret token as secret and a token without an actor with a null actorId', async () => {
    const spyToken = { id: 'spy', name: 'Spy', x: 400, y: 200, width: 1, height: 1, disposition: -2, actor: null };

    const { nearbyTokens } = await contextHandler([heroToken, spyToken])({});

    expect(nearbyTokens[0]).toEqual({
      tokenId: 'spy',
      actorId: null,
      name: 'Spy',
      gridX: 4,
      gridY: 2,
      distanceFt: 10,
      disposition: 'secret',
      lineOfSight: true,
      conditions: []
    });
  });

  it('heads the map with the viewed scene and lists the participants in it', async () => {
    const { asciiMap } = await contextHandler([heroToken])({});

    expect(asciiMap.startsWith('Docks | 5ft/cell\n')).toBe(true);
    expect(asciiMap).toContain(`1   ${'Hero'.padEnd(30)} 1x1   0/30       (2,2)`);
  });
});

describe('get-combat-turn-context on the scene of the current token', () => {
  // `Combatant#token` is only trusted on the cores it was verified on.
  beforeEach(() => {
    (globalThis as Record<string, unknown>)['game'] = { release: { generation: 13 } };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  function tokenAt(id: string, x: number, y: number, size = 1) {
    return { id, name: id, x, y, width: size, height: size, disposition: -1, actor: null };
  }

  function handlerFor(options: {
    heroToken: FakeCombatant['token'];
    viewed: FakeScene | null;
    scenes: FakeScene[];
    sight?: { testCollision: jest.Mock };
  }) {
    const hero = fakeCombatant({ id: 'c-hero', tokenId: 'hero', name: 'Hero', token: options.heroToken });
    const ghoul = fakeCombatant({ id: 'c-ghoul', tokenId: 'ghoul', name: 'Ghoul' });
    return createGetCombatTurnContextHandler({
      ...wiringFor(fakeCombat('fight', [hero, ghoul], hero), [], options.scenes),
      canvasGlobals: () => ({
        canvas: { scene: options.viewed },
        CONFIG: {
          Canvas: {
            polygonBackends: {
              move: { testCollision: () => false },
              ...(options.sight ? { sight: options.sight } : {})
            }
          }
        }
      })
    });
  }

  const crypt = fakeScene('crypt', 'Crypt', [tokenAt('hero', 400, 200), tokenAt('ghoul', 100, 200, 2)]);
  const tavern = fakeScene('tavern', 'Tavern', [tokenAt('patron', 0, 0)]);

  it('describes the scene the core finds the token on while the GM views another one', async () => {
    const sight = { testCollision: jest.fn().mockReturnValue(true) };
    const handler = handlerFor({ heroToken: { parent: { id: 'crypt' } }, viewed: tavern, scenes: [crypt, tavern], sight });

    const result = await handler({});

    expect(result.currentCombatant).toMatchObject({ tokenId: 'hero', gridX: 4, gridY: 2 });
    expect(result.nearbyTokens).toMatchObject([{ tokenId: 'ghoul', lineOfSight: true }]);
    expect(sight.testCollision).not.toHaveBeenCalled();
    expect(result.asciiMap).toBe('[ASCII map unavailable — no collision backend]');
  });

  it('asks the canvas about sight and draws the map when the GM views that scene', async () => {
    const sight = { testCollision: jest.fn().mockReturnValue(true) };
    const handler = handlerFor({ heroToken: { parent: { id: 'crypt' } }, viewed: crypt, scenes: [crypt, tavern], sight });

    const result = await handler({});

    expect(result.nearbyTokens).toMatchObject([{ tokenId: 'ghoul', lineOfSight: false }]);
    expect(result.asciiMap.startsWith('Crypt | 5ft/cell\n')).toBe(true);
  });

  it('measures to the nearest cell of a 2x2 token and looks at its centre', async () => {
    const sight = { testCollision: jest.fn().mockReturnValue(false) };
    const handler = handlerFor({ heroToken: { parent: { id: 'crypt' } }, viewed: crypt, scenes: [crypt], sight });

    const { nearbyTokens } = await handler({});

    expect(nearbyTokens[0]).toMatchObject({ tokenId: 'ghoul', gridX: 1, gridY: 2, distanceFt: 10 });
    expect(sight.testCollision).toHaveBeenCalledWith({ x: 450, y: 250 }, { x: 200, y: 300 }, { type: 'sight', mode: 'any' });
  });

  it('describes the viewed scene, as before, when the core finds the token on no scene', async () => {
    const handler = handlerFor({ heroToken: null, viewed: crypt, scenes: [crypt, tavern] });

    await expect(handler({})).resolves.toMatchObject({ currentCombatant: { tokenId: 'hero', gridX: 4 } });
  });

  it('keeps the old error when the token is neither placed by the core nor on the viewed scene', async () => {
    const handler = handlerFor({ heroToken: null, viewed: tavern, scenes: [crypt, tavern] });

    await expect(handler({})).rejects.toThrow('Token not found for current combatant: hero');
  });

  it('keeps the old error when no scene can be found at all', async () => {
    const handler = handlerFor({ heroToken: null, viewed: null, scenes: [crypt] });

    await expect(handler({})).rejects.toThrow('No active scene');
  });
});
