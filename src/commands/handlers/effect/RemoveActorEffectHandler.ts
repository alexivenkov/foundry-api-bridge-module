import type { RemoveActorEffectParams, RemoveEffectResult } from '@/commands/types';
import { getGame } from './effectTypes';

export async function removeActorEffectHandler(
  params: RemoveActorEffectParams
): Promise<RemoveEffectResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const effect = actor.effects.get(params.effectId);

  if (!effect) {
    throw new Error(`Effect not found: ${params.effectId}`);
  }

  await effect.delete();

  return {
    actorId: actor.id,
    effectId: params.effectId,
    removed: true
  };
}