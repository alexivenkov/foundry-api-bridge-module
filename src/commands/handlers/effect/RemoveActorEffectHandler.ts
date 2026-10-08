import type { RemoveActorEffectParams, RemoveEffectResult } from '@/commands/types';
import { resolveEffectActor } from './effectTypes';

export async function removeActorEffectHandler(
  params: RemoveActorEffectParams
): Promise<RemoveEffectResult> {
  const actor = resolveEffectActor(params);

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