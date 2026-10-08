import type { GetActorEffectsParams, ActorEffectsResult } from '@/commands/types';
import { mapEffectToSummary, resolveEffectActor } from './effectTypes';

export function getActorEffectsHandler(
  params: GetActorEffectsParams
): Promise<ActorEffectsResult> {
  let actor;
  try {
    actor = resolveEffectActor(params);
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
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