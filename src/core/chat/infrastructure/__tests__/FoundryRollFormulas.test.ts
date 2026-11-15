import { FoundryDiceRoller } from '../FoundryDiceRoller';
import { FoundryRollData } from '../FoundryRollData';
import { FoundryRollFormulas } from '../FoundryRollFormulas';
import type { FoundryRoll, FoundryRollDataActor, FoundryRollDataGame, FoundryRollStatics } from '../foundryRollTypes';

function runOn(generation: number): void {
  (global as Record<string, unknown>)['game'] = { release: { generation } };
}

afterEach(() => {
  delete (global as Record<string, unknown>)['game'];
});

/** The actor's live system data, which the core's Actor#getRollData returns. */
function liveSystem(): Record<string, unknown> {
  return { prof: 2, abilities: { str: { mod: 3 } } };
}

function rollDataOver(system: unknown): FoundryRollData {
  const goblin: FoundryRollDataActor = { id: 'a1', name: 'Goblin', getRollData: () => system };
  const game: FoundryRollDataGame = {
    actors: { get: (id) => (id === 'a1' ? goblin : undefined) },
    scenes: {
      get: (id) => (id === 's1' ? { id: 's1', tokens: { get: (tokenId) => (tokenId === 't1' ? { id: 't1', actor: goblin } : undefined) } } : undefined),
      active: undefined
    }
  };
  return new FoundryRollData({ getGame: () => game });
}

/** `foundry.utils.getProperty`: a path is walked with `in`, which follows the prototype. */
function getProperty(data: object, path: string): unknown {
  let target: unknown = data;
  for (const key of path.split('.')) {
    if (typeof target !== 'object' || target === null || !(key in target)) {
      return undefined;
    }
    target = (target as Record<string, unknown>)[key];
  }
  return target;
}

/**
 * `Roll.replaceFormulaData` as probed on 13.351 and 14.368: an unset (or null)
 * reference stays in place unless `missing` is given; 14 also reads `@{path}`.
 */
function coreReplaceFormulaData(formula: string, data: object, options: { missing?: string } = {}): string {
  const pattern = (global as { game?: { release?: { generation?: number } } }).game?.release?.generation === 14
    ? /@\{[-.\w]+\}|@[-.\w]+/g
    : /@[a-z.0-9_-]+/gi;
  return formula.replace(pattern, (match) => {
    const value = getProperty(data, match.replace(/^@\{?|\}?$/g, ''));
    if (value === undefined || value === null) {
      return options.missing ?? match;
    }
    return String(value);
  });
}

function statics(overrides: Partial<FoundryRollStatics> = {}): FoundryRollStatics & Record<string, jest.Mock> {
  return {
    validate: jest.fn().mockReturnValue(true),
    simulate: jest.fn().mockResolvedValue([4, 6]),
    replaceFormulaData: jest.fn(coreReplaceFormulaData),
    ...overrides
  } as FoundryRollStatics & Record<string, jest.Mock>;
}

describe('FoundryRollData', () => {
  const actor = { actor: { kind: 'world', actorId: 'a1' } } as const;

  it('hands over the actor roll data itself, not a copy', () => {
    const system = liveSystem();

    expect(rollDataOver(system).materialize(actor)).toBe(system);
  });

  it('reaches the actor of a token', () => {
    const system = liveSystem();

    expect(rollDataOver(system).materialize({ actor: { kind: 'token', sceneId: 's1', tokenId: 't1' } })).toBe(system);
  });

  it('hands over the caller values alone', () => {
    const values = { bonus: 1 };

    expect(rollDataOver(liveSystem()).materialize({ values })).toBe(values);
  });

  it('layers the caller values over the actor data without touching it', () => {
    const system = liveSystem();
    const data = rollDataOver(system).materialize({ ...actor, values: { prof: 5, bonus: 1 } });

    expect(getProperty(data, 'prof')).toBe(5);
    expect(getProperty(data, 'bonus')).toBe(1);
    expect(getProperty(data, 'abilities.str.mod')).toBe(3);
    expect(system).toEqual(liveSystem());
  });

  it('reads roll data that is not an object as none', () => {
    expect(rollDataOver(null).materialize(actor)).toEqual({});
    expect(rollDataOver(7).materialize({ ...actor, values: { a: 1 } })).toEqual({ a: 1 });
  });

  it('fails like the actor lookup when the actor is gone', () => {
    expect(() => rollDataOver({}).materialize({ actor: { kind: 'world', actorId: 'gone' } })).toThrow('Actor not found: gone');
  });
});

describe('FoundryRollFormulas', () => {
  const actor = { actor: { kind: 'world', actorId: 'a1' } } as const;

  function formulas(Roll = statics()): { gateway: FoundryRollFormulas; Roll: FoundryRollStatics & Record<string, jest.Mock> } {
    return { gateway: new FoundryRollFormulas(() => ({ Roll }), rollDataOver(liveSystem())), Roll };
  }

  describe('findUnresolvedReferences', () => {
    it('lists every reference once when there is no roll data', () => {
      runOn(13);

      expect(formulas().gateway.findUnresolvedReferences('1d20 + @prof + @prof + @abilities.str.mod', undefined)).toEqual([
        '@prof',
        '@abilities.str.mod'
      ]);
    });

    it('lists what the actor and caller data leave unset', () => {
      runOn(13);

      expect(
        formulas().gateway.findUnresolvedReferences('1d20 + @prof + @bonus + @abilities.dex.mod + @prof.x', {
          ...actor,
          values: { bonus: 1 }
        })
      ).toEqual(['@abilities.dex.mod', '@prof.x']);
    });

    it('does not read @{path} on Foundry 13, where the core does not either', () => {
      runOn(13);

      expect(formulas().gateway.findUnresolvedReferences('@{prof} + @{nope}', actor)).toEqual([]);
    });

    it('reads @{path} on Foundry 14', () => {
      runOn(14);

      expect(formulas().gateway.findUnresolvedReferences('@{prof} + @{nope} + @x', actor)).toEqual(['@{nope}', '@x']);
    });

    it('asks the core about each reference alone', () => {
      runOn(13);
      const { gateway, Roll } = formulas();

      gateway.findUnresolvedReferences('1d20 + @prof', actor);

      expect(Roll['replaceFormulaData']).toHaveBeenCalledWith('@prof', expect.anything());
    });
  });

  describe('isValid', () => {
    it('hands the formula to Roll.validate as it is without roll data', () => {
      const { gateway, Roll } = formulas();

      expect(gateway.isValid('1d20 + @prof', undefined)).toBe(true);
      expect(Roll['validate']).toHaveBeenCalledWith('1d20 + @prof');
    });

    it('validates the formula with the roll data substituted, an unset reference as 0', () => {
      runOn(13);
      const { gateway, Roll } = formulas(statics({ validate: jest.fn().mockReturnValue(false) }));

      expect(gateway.isValid('1d20 + @prof + @nope', actor)).toBe(false);
      expect(Roll['validate']).toHaveBeenCalledWith('1d20 + 2 + 0');
    });
  });

  describe('simulate', () => {
    it('simulates the formula as it is without roll data', async () => {
      const { gateway, Roll } = formulas();

      await expect(gateway.simulate('2d6', undefined, 2)).resolves.toEqual([4, 6]);
      expect(Roll['simulate']).toHaveBeenCalledWith('2d6', 2);
    });

    it('simulates the formula with the roll data substituted', async () => {
      runOn(14);
      const { gateway, Roll } = formulas();

      await gateway.simulate('1d6 + @{prof}', actor, 50);

      expect(Roll['simulate']).toHaveBeenCalledWith('1d6 + 2', 50);
    });

    it('takes the synchronous result of an older core as well', async () => {
      const { gateway } = formulas(statics({ simulate: jest.fn().mockReturnValue([1, 2, 3]) }));

      await expect(gateway.simulate('1d3', undefined, 3)).resolves.toEqual([1, 2, 3]);
    });
  });
});

describe('FoundryDiceRoller with options', () => {
  function roller(): { roller: FoundryDiceRoller; Roll: jest.Mock; toMessage: jest.Mock; system: Record<string, unknown> } {
    const toMessage = jest.fn().mockResolvedValue(undefined);
    const instance: FoundryRoll = { total: 0, formula: '', terms: [], evaluate: jest.fn(), toMessage };
    const Roll = jest.fn(() => instance);
    const system = liveSystem();
    return {
      roller: new FoundryDiceRoller(() => ({ Roll: Roll as unknown as new (formula: string, data?: object) => FoundryRoll }), rollDataOver(system)),
      Roll,
      toMessage,
      system
    };
  }

  it('constructs the roll with the roll data', () => {
    const { roller: dice, Roll, system } = roller();

    dice.prepare('1d20 + @prof', { actor: { kind: 'world', actorId: 'a1' } });

    expect(Roll).toHaveBeenCalledWith('1d20 + @prof', system);
  });

  it('constructs the roll from the formula alone without roll data', () => {
    const { roller: dice, Roll } = roller();

    dice.prepare('1d20');

    expect(Roll.mock.calls[0]).toEqual(['1d20']);
  });

  it.each([
    [13, { rollMode: 'blindroll' }],
    [14, { messageMode: 'blind' }]
  ])('posts with the speaker and the visibility option of Foundry %i', async (generation, options) => {
    runOn(generation);
    const { roller: dice, toMessage } = roller();

    await dice.prepare('1d20').post('Stealth', {
      speaker: { alias: 'Grik', actorId: 'a1', tokenId: 't1', sceneId: 's1' },
      visibility: 'blind'
    });

    expect(toMessage).toHaveBeenCalledWith(
      { flavor: 'Stealth', speaker: { scene: 's1', actor: 'a1', token: 't1', alias: 'Grik' } },
      options
    );
  });

  it.each([
    ['public', 'publicroll'],
    ['gm', 'gmroll'],
    ['self', 'selfroll']
  ] as const)('maps %s to the roll mode %s on Foundry 13', async (visibility, rollMode) => {
    runOn(13);
    const { roller: dice, toMessage } = roller();

    await dice.prepare('1d20').post(undefined, { visibility });

    expect(toMessage).toHaveBeenCalledWith({}, { rollMode });
  });

  it('posts a speaker without a visibility option, leaving the GM roll mode in charge', async () => {
    const { roller: dice, toMessage } = roller();

    await dice.prepare('1d20').post(undefined, { speaker: { alias: 'Narrator', actorId: null, tokenId: null, sceneId: null } });

    expect(toMessage.mock.calls[0]).toEqual([{ speaker: { scene: null, actor: null, token: null, alias: 'Narrator' } }]);
  });
});
