import type { ActivateItemParams, ActivateItemResult } from '@/commands/types';
import { getGame, getCanvas, type FoundryActivity } from './itemTypes';

function setTargets(tokenIds: string[]): number {
  const canvas = getCanvas();
  const game = getGame();

  for (const existing of game.user.targets) {
    existing.setTarget(false, { user: game.user, releaseOthers: false });
  }

  let count = 0;
  for (const tokenId of tokenIds) {
    const token = canvas.tokens.get(tokenId);
    if (!token) {
      throw new Error(`Target token not found: ${tokenId}`);
    }
    token.setTarget(true, { user: game.user, releaseOthers: false });
    count++;
  }

  return count;
}

export async function activateItemHandler(params: ActivateItemParams): Promise<ActivateItemResult> {
  const game = getGame();
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const item = actor.items.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  const targetsSet = params.targetTokenIds?.length
    ? setTargets(params.targetTokenIds)
    : 0;

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

  if (targetActivity) {
    await targetActivity.use();

    return {
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      activityUsed: {
        id: targetActivity._id,
        name: targetActivity.name,
        type: targetActivity.type
      },
      activated: true,
      targetsSet
    };
  }

  await item.use();

  return {
    itemId: item.id,
    itemName: item.name,
    itemType: item.type,
    activated: true,
    targetsSet
  };
}
