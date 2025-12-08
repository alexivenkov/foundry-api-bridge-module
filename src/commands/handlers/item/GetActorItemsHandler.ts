import type { GetActorItemsParams, ActorItemsResult, ItemDetailSummary } from '@/commands/types';
import { getGame, type FoundryItem } from './itemTypes';

function mapItemToSummary(item: FoundryItem): ItemDetailSummary {
  const activities = item.system.activities?.contents ?? [];

  return {
    id: item.id,
    name: item.name,
    type: item.type,
    img: item.img,
    equipped: item.system.equipped ?? false,
    quantity: item.system.quantity ?? 1,
    hasActivities: activities.length > 0,
    activityTypes: activities.map(a => a.type)
  };
}

export function getActorItemsHandler(params: GetActorItemsParams): Promise<ActorItemsResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    return Promise.reject(new Error(`Actor not found: ${params.actorId}`));
  }

  let items = actor.items.contents;

  if (params.type) {
    items = items.filter(item => item.type === params.type);
  }

  if (params.equipped !== undefined) {
    items = items.filter(item => (item.system.equipped ?? false) === params.equipped);
  }

  if (params.hasActivities !== undefined) {
    items = items.filter(item => {
      const hasActs = (item.system.activities?.contents.length ?? 0) > 0;
      return hasActs === params.hasActivities;
    });
  }

  return Promise.resolve({
    actorId: actor.id,
    actorName: actor.name,
    items: items.map(mapItemToSummary)
  });
}