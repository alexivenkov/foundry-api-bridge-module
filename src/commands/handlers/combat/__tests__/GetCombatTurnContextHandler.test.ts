import { getCombatTurnContextHandler } from '../GetCombatTurnContextHandler';

interface MockToken {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  disposition: number;
  actor: {
    id: string;
    system?: {
      attributes?: {
        hp?: { value: number; max: number };
        ac?: { value: number };
      };
    };
    statuses?: Set<string>;
  } | null;
}

interface MockCombatant {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
}

function createMockToken(overrides?: Partial<MockToken>): MockToken {
  return {
    id: 'token-1',
    name: 'Goblin',
    x: 500,
    y: 500,
    width: 1,
    height: 1,
    disposition: -1,
    actor: {
      id: 'actor-1',
      system: { attributes: { hp: { value: 7, max: 7 }, ac: { value: 13 } } },
      statuses: new Set<string>()
    },
    ...overrides
  };
}

function createMockCombatant(overrides?: Partial<MockCombatant>): MockCombatant {
  return {
    id: 'combatant-1',
    actorId: 'actor-1',
    tokenId: 'token-1',
    name: 'Goblin',
    ...overrides
  };
}

function setGlobals(options: {
  combat?: {
    round?: number;
    turn?: number;
    combatant?: MockCombatant | null;
    combatants?: MockCombatant[];
  } | null;
  tokens?: MockToken[];
  walls?: Array<{ c: number[]; door: number; ds: number; move: number }>;
  sightBackend?: { testCollision: jest.Mock } | undefined;
  moveBackend?: { testCollision: jest.Mock } | undefined;
}): void {
  const combat = options.combat !== undefined ? (options.combat !== null ? {
    id: 'combat-1',
    round: options.combat.round ?? 1,
    turn: options.combat.turn ?? 0,
    combatant: options.combat.combatant ?? null,
    combatants: { contents: options.combat.combatants ?? [] }
  } : null) : null;

  (globalThis as Record<string, unknown>)['game'] = {
    combat,
    combats: { get: jest.fn().mockReturnValue(combat) }
  };

  (globalThis as Record<string, unknown>)['canvas'] = {
    scene: {
      name: 'Test Scene',
      grid: { size: 100, distance: 5, units: 'ft' },
      tokens: { contents: options.tokens ?? [] },
      walls: { contents: options.walls ?? [] }
    }
  };

  (globalThis as Record<string, unknown>)['CONFIG'] = {
    Canvas: {
      polygonBackends: {
        move: options.moveBackend ?? { testCollision: jest.fn().mockReturnValue(false) },
        sight: options.sightBackend
      }
    }
  };
}

function clearGlobals(): void {
  delete (globalThis as Record<string, unknown>)['game'];
  delete (globalThis as Record<string, unknown>)['canvas'];
  delete (globalThis as Record<string, unknown>)['CONFIG'];
}

describe('getCombatTurnContextHandler', () => {
  afterEach(clearGlobals);

  it('should return full combat turn context', async () => {
    const currentToken = createMockToken({ id: 'token-1', name: 'Fighter', x: 500, y: 500, disposition: 1 });
    const enemyToken = createMockToken({
      id: 'token-2', name: 'Goblin', x: 700, y: 500, disposition: -1,
      actor: { id: 'actor-2', system: { attributes: { hp: { value: 5, max: 7 }, ac: { value: 13 } } }, statuses: new Set(['poisoned']) }
    });

    const currentCombatant = createMockCombatant({ id: 'c1', tokenId: 'token-1', actorId: 'actor-1', name: 'Fighter' });
    const enemyCombatant = createMockCombatant({ id: 'c2', tokenId: 'token-2', actorId: 'actor-2', name: 'Goblin' });

    setGlobals({
      combat: { round: 3, turn: 1, combatant: currentCombatant, combatants: [currentCombatant, enemyCombatant] },
      tokens: [currentToken, enemyToken]
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.round).toBe(3);
    expect(result.turn).toBe(1);
    expect(result.currentCombatant.name).toBe('Fighter');
    expect(result.currentCombatant.gridX).toBe(5);
    expect(result.currentCombatant.gridY).toBe(5);
    expect(result.nearbyTokens).toHaveLength(1);
    expect(result.nearbyTokens[0]?.name).toBe('Goblin');
    expect(result.nearbyTokens[0]?.distanceFt).toBe(10);
    expect(result.nearbyTokens[0]?.disposition).toBe('hostile');
    expect(result.nearbyTokens[0]?.hp).toEqual({ value: 5, max: 7 });
    expect(result.nearbyTokens[0]?.conditions).toEqual(['poisoned']);
    expect(typeof result.asciiMap).toBe('string');
  });

  it('should include actorId in nearby tokens', async () => {
    const currentToken = createMockToken({ id: 'token-1' });
    const nearbyToken = createMockToken({ id: 'token-2', actor: { id: 'actor-2' } });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 'token-2', actorId: 'actor-2' })
        ]
      },
      tokens: [currentToken, nearbyToken]
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.nearbyTokens[0]?.actorId).toBe('actor-2');
  });

  it('should calculate correct distance in feet', async () => {
    const currentToken = createMockToken({ id: 'token-1', x: 0, y: 0 });
    const farToken = createMockToken({ id: 'token-2', x: 600, y: 400 });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 'token-2' })
        ]
      },
      tokens: [currentToken, farToken]
    });

    const result = await getCombatTurnContextHandler({});

    // Chebyshev: max(|6-0|, |4-0|) = 6 cells × 5ft = 30ft
    expect(result.nearbyTokens[0]?.distanceFt).toBe(30);
  });

  it('should detect line of sight blocked by wall', async () => {
    const currentToken = createMockToken({ id: 'token-1', x: 100, y: 100 });
    const blockedToken = createMockToken({ id: 'token-2', x: 300, y: 100 });

    const sightBackend = {
      testCollision: jest.fn().mockReturnValue(true) // blocked
    };

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 'token-2' })
        ]
      },
      tokens: [currentToken, blockedToken],
      sightBackend
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.nearbyTokens[0]?.lineOfSight).toBe(false);
    expect(sightBackend.testCollision).toHaveBeenCalledWith(
      { x: 150, y: 150 },
      { x: 350, y: 150 },
      { type: 'sight', mode: 'any' }
    );
  });

  it('should default lineOfSight to true without sight backend', async () => {
    const currentToken = createMockToken({ id: 'token-1' });
    const otherToken = createMockToken({ id: 'token-2' });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 'token-2' })
        ]
      },
      tokens: [currentToken, otherToken],
      sightBackend: undefined
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.nearbyTokens[0]?.lineOfSight).toBe(true);
  });

  it('should reject when no active combat', async () => {
    setGlobals({ combat: null, tokens: [] });

    await expect(getCombatTurnContextHandler({}))
      .rejects.toThrow('No active combat');
  });

  it('should reject when no current combatant', async () => {
    setGlobals({
      combat: { combatant: null, combatants: [] },
      tokens: []
    });

    await expect(getCombatTurnContextHandler({}))
      .rejects.toThrow('No current combatant');
  });

  it('should reject when combatant has no token', async () => {
    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: null }),
        combatants: [createMockCombatant({ tokenId: null })]
      },
      tokens: []
    });

    await expect(getCombatTurnContextHandler({}))
      .rejects.toThrow('Current combatant has no token');
  });

  it('should sort nearby tokens by distance', async () => {
    const currentToken = createMockToken({ id: 'token-1', x: 0, y: 0 });
    const farToken = createMockToken({ id: 'token-far', x: 1000, y: 0 });
    const nearToken = createMockToken({ id: 'token-near', x: 100, y: 0 });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 'token-far' }),
          createMockCombatant({ tokenId: 'token-near' })
        ]
      },
      tokens: [currentToken, farToken, nearToken]
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.nearbyTokens[0]?.tokenId).toBe('token-near');
    expect(result.nearbyTokens[1]?.tokenId).toBe('token-far');
  });

  it('should map disposition correctly', async () => {
    const currentToken = createMockToken({ id: 'token-1' });
    const hostile = createMockToken({ id: 't-h', disposition: -1 });
    const neutral = createMockToken({ id: 't-n', disposition: 0 });
    const friendly = createMockToken({ id: 't-f', disposition: 1 });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 't-h' }),
          createMockCombatant({ tokenId: 't-n' }),
          createMockCombatant({ tokenId: 't-f' })
        ]
      },
      tokens: [currentToken, hostile, neutral, friendly]
    });

    const result = await getCombatTurnContextHandler({});

    const dispositions = result.nearbyTokens.map(t => t.disposition);
    expect(dispositions).toContain('hostile');
    expect(dispositions).toContain('neutral');
    expect(dispositions).toContain('friendly');
  });

  it('should only include combatant tokens, not scene decoration', async () => {
    const currentToken = createMockToken({ id: 'token-1' });
    const combatToken = createMockToken({ id: 'token-combat' });
    const decorationToken = createMockToken({ id: 'token-decor', name: 'Barrel' });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [
          createMockCombatant({ tokenId: 'token-1' }),
          createMockCombatant({ tokenId: 'token-combat' })
        ]
      },
      tokens: [currentToken, combatToken, decorationToken]
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.nearbyTokens).toHaveLength(1);
    expect(result.nearbyTokens[0]?.tokenId).toBe('token-combat');
  });

  it('should include HP and AC for current combatant', async () => {
    const currentToken = createMockToken({
      id: 'token-1',
      actor: { id: 'a1', system: { attributes: { hp: { value: 25, max: 30 }, ac: { value: 18 } } }, statuses: new Set(['blessed']) }
    });

    setGlobals({
      combat: {
        combatant: createMockCombatant({ tokenId: 'token-1' }),
        combatants: [createMockCombatant({ tokenId: 'token-1' })]
      },
      tokens: [currentToken]
    });

    const result = await getCombatTurnContextHandler({});

    expect(result.currentCombatant.hp).toEqual({ value: 25, max: 30 });
    expect(result.currentCombatant.ac).toBe(18);
    expect(result.currentCombatant.conditions).toEqual(['blessed']);
  });
});
