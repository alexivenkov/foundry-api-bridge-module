import type { GetActorEffectsParams, ActorEffectsResult } from '@/commands/types';
import { getGame, mapEffectToSummary } from './effectTypes';

export function getActorEffectsHandler(
  params: GetActorEffectsParams
): Promise<ActorEffectsResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    return Promise.reject(new Error(`Actor not found: ${params.actorId}`));
  }

  const includeDisabled = params.includeDisabled ?? true;

  let effects = actor.effects.contents;

  if (!includeDisabled) {
    effects = effects.filter(e => !e.disabled);
  }

  return Promise.resolve({
    actorId: actor.id,
    actorName: actor.name,
    effects: effects.map(mapEffectToSummary),
    activeStatuses: Array.from(actor.statuses)
  });
}