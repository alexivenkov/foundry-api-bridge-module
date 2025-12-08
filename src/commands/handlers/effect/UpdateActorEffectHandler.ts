import type { UpdateActorEffectParams, UpdateEffectResult } from '@/commands/types';
import { getGame } from './effectTypes';

export async function updateActorEffectHandler(
  params: UpdateActorEffectParams
): Promise<UpdateEffectResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const effect = actor.effects.get(params.effectId);

  if (!effect) {
    throw new Error(`Effect not found: ${params.effectId}`);
  }

  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.img !== undefined) {
    updateData['img'] = params.img;
  }

  if (params.disabled !== undefined) {
    updateData['disabled'] = params.disabled;
  }

  if (params.changes !== undefined) {
    updateData['changes'] = params.changes;
  }

  if (params.duration !== undefined) {
    updateData['duration'] = params.duration;
  }

  const updatedEffect = await effect.update(updateData);

  return {
    actorId: actor.id,
    effectId: params.effectId,
    name: updatedEffect.name
  };
}