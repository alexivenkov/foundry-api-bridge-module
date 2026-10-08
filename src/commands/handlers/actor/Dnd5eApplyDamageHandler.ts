import type { ApplyDamageParams, HitPointsChangeResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  applyDamageRequestSchema,
  createDnd5eHitPointsService,
  Dnd5eHitPointsGateway,
  getDnd5eHitPointsGame,
  RequestToCommandMapper,
  type HitPointsChangeOutcome
} from '@/systems/dnd5e/hit-points';

export function toHitPointsChangeResult(outcome: HitPointsChangeOutcome): HitPointsChangeResult {
  const result: HitPointsChangeResult = {
    actorId: outcome.actorId,
    hpBefore: outcome.hpBefore,
    hpAfter: outcome.hpAfter,
    tempBefore: outcome.tempBefore,
    tempAfter: outcome.tempAfter,
    maxHp: outcome.maxHp
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

export async function dnd5eApplyDamageHandler(params: ApplyDamageParams): Promise<HitPointsChangeResult> {
  requireSystem('dnd5e', 'dnd5e/apply-damage');

  const parsed = applyDamageRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toApplyDamageCommand(parsed.data);
  const service = createDnd5eHitPointsService({
    hitPoints: new Dnd5eHitPointsGateway(getDnd5eHitPointsGame())
  });

  return toHitPointsChangeResult(await service.applyDamage(command));
}
