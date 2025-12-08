import type { ToggleActorStatusParams, ToggleStatusResult } from '@/commands/types';
import { getGame } from './effectTypes';

export async function toggleActorStatusHandler(
  params: ToggleActorStatusParams
): Promise<ToggleStatusResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const options: { active?: boolean; overlay?: boolean } = {};

  if (params.active !== undefined) {
    options.active = params.active;
  }

  if (params.overlay !== undefined) {
    options.overlay = params.overlay;
  }

  const result = await actor.toggleStatusEffect(
    params.statusId,
    Object.keys(options).length > 0 ? options : undefined
  );

  const toggleResult: ToggleStatusResult = {
    actorId: actor.id,
    statusId: params.statusId,
    active: false
  };

  if (result === true) {
    toggleResult.active = true;
  } else if (result === false || result === undefined) {
    toggleResult.active = false;
  } else {
    toggleResult.active = true;
    toggleResult.effectId = result._id;
  }

  return toggleResult;
}