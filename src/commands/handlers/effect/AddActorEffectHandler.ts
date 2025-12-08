import type { AddActorEffectParams, AddEffectResult } from '@/commands/types';
import { getGame, type ActiveEffectCreateData } from './effectTypes';

export async function addActorEffectHandler(
  params: AddActorEffectParams
): Promise<AddEffectResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const effectData: ActiveEffectCreateData = {
    name: params.name
  };

  if (params.img !== undefined) {
    effectData.img = params.img;
  }

  if (params.disabled !== undefined) {
    effectData.disabled = params.disabled;
  }

  if (params.origin !== undefined) {
    effectData.origin = params.origin;
  }

  if (params.statuses !== undefined) {
    effectData.statuses = params.statuses;
  }

  if (params.changes !== undefined) {
    effectData.changes = params.changes;
  }

  if (params.duration !== undefined) {
    effectData.duration = params.duration;
  }

  const createdEffects = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);

  const createdEffect = createdEffects?.[0];

  if (!createdEffect) {
    throw new Error('Failed to create effect');
  }

  return {
    actorId: actor.id,
    effectId: createdEffect._id,
    name: createdEffect.name
  };
}