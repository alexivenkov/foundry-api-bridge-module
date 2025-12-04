import type { RollDamageParams, RollResult } from '@/commands/types';
import { extractDiceResults } from '@/commands/handlers/shared';
import type { FoundryDamageRoll, RollDialogConfig, RollMessageConfig } from '@/commands/handlers/shared';

interface DamageRollConfig {
  isCritical?: boolean;
}

interface FoundryActivity {
  _id: string;
  type: string;
  rollDamage(
    config?: DamageRollConfig,
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryDamageRoll[] | null>;
}

interface FoundryActivitiesCollection {
  find(predicate: (activity: FoundryActivity) => boolean): FoundryActivity | undefined;
}

interface FoundryItemSystem {
  activities?: FoundryActivitiesCollection;
}

interface FoundryItem {
  id: string;
  name: string;
  type: string;
  system: FoundryItemSystem;
}

interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

interface FoundryActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function rollDamageHandler(params: RollDamageParams): Promise<RollResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const item = actor.items.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  if (!item.system.activities) {
    throw new Error(`Item has no activities: ${item.name}`);
  }

  const attackActivity = item.system.activities.find(a => a.type === 'attack');

  if (!attackActivity) {
    throw new Error(`Item has no attack activity: ${item.name}`);
  }

  const rollConfig: DamageRollConfig = {};

  if (params.critical) {
    rollConfig.isCritical = true;
  }

  const rolls = await attackActivity.rollDamage(
    rollConfig,
    { configure: false },
    { create: params.showInChat ?? false }
  );

  if (!rolls || rolls.length === 0) {
    throw new Error('Damage roll returned no results');
  }

  const roll = rolls[0];

  if (!roll) {
    throw new Error('Damage roll returned no results');
  }

  const dice = extractDiceResults(roll.terms);

  const result: RollResult = {
    total: roll.total,
    formula: roll.formula,
    dice
  };

  if (params.critical) {
    result.isCritical = true;
  }

  return result;
}