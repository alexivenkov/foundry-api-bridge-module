import type { UseItemParams, UseItemResult, RollResult } from '@/commands/types';
import { extractDiceResults, getGame, type FoundryActivity, type FoundryRoll } from './itemTypes';

function extractRollResults(rolls: FoundryRoll[] | undefined): RollResult[] {
  if (!rolls || rolls.length === 0) {
    return [];
  }

  return rolls.map(roll => {
    const result: RollResult = {
      total: roll.total,
      formula: roll.formula,
      dice: extractDiceResults(roll.terms)
    };

    if (roll.isCritical) {
      result.isCritical = true;
    }

    if (roll.isFumble) {
      result.isFumble = true;
    }

    return result;
  });
}

export async function useItemHandler(params: UseItemParams): Promise<UseItemResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const item = actor.items.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  const activities = item.system.activities?.contents ?? [];

  let targetActivity: FoundryActivity | undefined;

  if (params.activityId) {
    targetActivity = item.system.activities?.get(params.activityId);
    if (!targetActivity) {
      throw new Error(`Activity not found: ${params.activityId}`);
    }
  } else if (params.activityType) {
    targetActivity = item.system.activities?.find(a => a.type === params.activityType);
    if (!targetActivity) {
      throw new Error(`No activity of type '${params.activityType}' found on item: ${item.name}`);
    }
  } else if (activities.length > 0) {
    targetActivity = activities[0];
  }

  const usageConfig: {
    consume: { resources: boolean; spellSlot: boolean } | false;
    scaling?: number;
  } = {
    consume: params.consume === false
      ? false
      : { resources: true, spellSlot: true }
  };

  if (params.scaling !== undefined) {
    usageConfig.scaling = params.scaling;
  }

  const dialogConfig = { configure: false };
  const messageConfig = { create: params.showInChat ?? false };

  if (targetActivity) {
    const result = await targetActivity.use(usageConfig, dialogConfig, messageConfig);

    const useResult: UseItemResult = {
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      activityUsed: {
        id: targetActivity._id,
        name: targetActivity.name,
        type: targetActivity.type
      },
      rolls: extractRollResults(result?.rolls)
    };

    if (result?.message) {
      useResult.chatMessageId = result.message.id;
    }

    return useResult;
  }

  const cardResult = await item.displayCard(messageConfig);

  const displayResult: UseItemResult = {
    itemId: item.id,
    itemName: item.name,
    itemType: item.type,
    rolls: []
  };

  if (cardResult?.id) {
    displayResult.chatMessageId = cardResult.id;
  }

  return displayResult;
}