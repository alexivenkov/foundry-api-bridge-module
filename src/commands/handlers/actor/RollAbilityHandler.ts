import { ABILITY_KEYS } from '@/commands/types';
import type { RollAbilityParams, RollResult, AbilityKey } from '@/commands/types';
import { extractDiceResults } from './actorTypes';
import type { FoundryD20Roll, RollDialogConfig, RollMessageConfig } from './actorTypes';

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