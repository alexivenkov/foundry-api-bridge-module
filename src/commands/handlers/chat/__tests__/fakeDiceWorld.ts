import type { FoundryChatSpeakerOptions, FoundryDiceGlobals } from '../../../../core/chat/infrastructure';

export const GM = 'GMGMGMGMGMGMGMGM';
export const ALICE = 'P1P1P1P1P1P1P1P1';

/** The actor's live system data, which the core's Actor#getRollData returns. */
export const goblinSystem = { prof: 2, abilities: { str: { mod: 3 } } };
export const goblin = { id: 'a1', name: 'Goblin', getRollData: (): object => goblinSystem };
export const scoutToken = { id: 't1', actor: goblin };
export const cave = { id: 's1', name: 'Cave', tokens: new Map([[scoutToken.id, scoutToken]]) };

/** `ChatMessage.getSpeaker` of 13.351 / 14.368 for these documents, as probed. */
export function coreGetSpeaker(options: FoundryChatSpeakerOptions = {}): Record<string, unknown> {
  if (options.token === scoutToken) {
    return { scene: 's1', token: 't1', actor: 'a1', alias: options.alias ?? 'Goblin Scout' };
  }
  if (options.actor === goblin) {
    return { scene: 's1', actor: 'a1', token: null, alias: options.alias ?? 'Goblin' };
  }
  return { scene: 's1', actor: null, token: null, alias: 'Gamemaster' };
}

function lookUp(data: object, path: string): unknown {
  let target: unknown = data;
  for (const key of path.split('.')) {
    if (typeof target !== 'object' || target === null || !(key in target)) {
      return undefined;
    }
    target = (target as Record<string, unknown>)[key];
  }
  return target;
}

/** `Roll.replaceFormulaData` of 14.368 as probed: an unset reference stays unless `missing` is given. */
function coreReplaceFormulaData(formula: string, data: object, options: { missing?: string } = {}): string {
  return formula.replace(/@\{[-.\w]+\}|@[-.\w]+/g, (match) => {
    const value = lookUp(data, match.replace(/^@\{?|\}?$/g, ''));
    return value === undefined || value === null ? (options.missing ?? match) : String(value);
  });
}

export interface DiceWorld {
  globals: FoundryDiceGlobals;
  Roll: jest.Mock & { validate: jest.Mock; simulate: jest.Mock; replaceFormulaData: jest.Mock };
  toMessage: jest.Mock;
  getSpeaker: jest.Mock;
}

/** A Foundry 14 world with one actor and its token; every roll comes out as 1d6 = 5. */
export function diceWorld(): DiceWorld {
  (global as Record<string, unknown>)['game'] = { release: { generation: 14 } };
  const toMessage = jest.fn().mockResolvedValue({ id: 'm1' });
  const Roll = Object.assign(
    jest.fn((formula: string) => ({
      formula,
      total: 5,
      terms: [{ faces: 6, number: 1, results: [{ result: 5 }] }],
      dice: [{ number: 1 }],
      evaluate: jest.fn().mockResolvedValue(undefined),
      toMessage
    })),
    {
      validate: jest.fn().mockReturnValue(true),
      simulate: jest.fn().mockResolvedValue([2, 4, 6]),
      replaceFormulaData: jest.fn(coreReplaceFormulaData)
    }
  );
  const getSpeaker = jest.fn(coreGetSpeaker);
  const globals = {
    Roll,
    game: {
      actors: { get: (id: string) => (id === goblin.id ? goblin : undefined) },
      scenes: { get: (id: string) => (id === cave.id ? cave : undefined), active: cave }
    },
    ChatMessage: { getSpeaker }
  } as unknown as FoundryDiceGlobals;
  return { globals, Roll, toMessage, getSpeaker };
}
