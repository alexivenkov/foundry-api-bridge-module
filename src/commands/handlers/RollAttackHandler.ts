import type { RollAttackParams, RollResult } from '@/commands/types';
import { extractDiceResults } from '@/commands/handlers/shared';
import type { FoundryD20Roll, RollDialogConfig, RollMessageConfig } from '@/commands/handlers/shared';

interface AttackRollConfig {
  advantage?: boolean;
  disadvantage?: boolean;
}

interface FoundryActivity {
  _id: string;
  type: string;
  rollAttack(
    config?: AttackRollConfig,
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[] | null>;
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

export async function rollAttackHandler(params: RollAttackParams): Promise<RollResult> {
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

  const rollConfig: AttackRollConfig = {};

  if (params.advantage) {
    rollConfig.advantage = true;
  }

  if (params.disadvantage) {
    rollConfig.disadvantage = true;
  }

  const rolls = await attackActivity.rollAttack(
    rollConfig,
    { configure: false },
    { create: params.showInChat ?? false }
  );

  if (!rolls || rolls.length === 0) {
    throw new Error('Attack roll returned no results');
  }

  const roll = rolls[0];

  if (!roll) {
    throw new Error('Attack roll returned no results');
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