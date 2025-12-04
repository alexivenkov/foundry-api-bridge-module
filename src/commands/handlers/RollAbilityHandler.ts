import type { RollAbilityParams, RollResult, DiceResult, AbilityKey } from '@/commands/types';

const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

interface FoundryD20Roll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical: boolean;
  isFumble: boolean;
}

interface RollDialogConfig {
  configure: boolean;
}

interface RollMessageConfig {
  create: boolean;
}

interface FoundryActor {
  id: string;
  name: string;
  rollAbilityCheck(
    config: { ability: AbilityKey },
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

function isValidAbilityKey(ability: string): ability is AbilityKey {
  return ABILITY_KEYS.includes(ability as AbilityKey);
}

function extractDiceResults(terms: FoundryDiceTerm[]): DiceResult[] {
  const diceResults: DiceResult[] = [];

  for (const term of terms) {
    if (term.faces !== undefined && term.results !== undefined) {
      diceResults.push({
        type: `d${String(term.faces)}`,
        count: term.number ?? 1,
        results: term.results.map(r => r.result)
      });
    }
  }

  return diceResults;
}

export async function rollAbilityHandler(params: RollAbilityParams): Promise<RollResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  if (!isValidAbilityKey(params.ability)) {
    throw new Error(`Invalid ability key: ${String(params.ability)}. Valid keys: ${ABILITY_KEYS.join(', ')}`);
  }

  const rolls = await actor.rollAbilityCheck(
    { ability: params.ability },
    { configure: false },
    { create: params.showInChat ?? false }
  );

  const roll = rolls[0];

  if (!roll) {
    throw new Error('Ability check roll returned no results');
  }

  const dice = extractDiceResults(roll.terms);

  const result: RollResult = {
    total: roll.total,
    formula: roll.formula,
    dice
  };

  if (roll.isCritical) {
    result.isCritical = true;
  }

  if (roll.isFumble) {
    result.isFumble = true;
  }

  return result;
}