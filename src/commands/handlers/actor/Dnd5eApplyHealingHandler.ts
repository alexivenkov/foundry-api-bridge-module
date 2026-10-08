import type { ApplyHealingParams, HitPointsChangeResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  applyHealingRequestSchema,
  createDnd5eHitPointsService,
  Dnd5eHitPointsGateway,
  getDnd5eHitPointsGame,
  RequestToCommandMapper
} from '@/systems/dnd5e/hit-points';
import { toHitPointsChangeResult } from './Dnd5eApplyDamageHandler';

export async function dnd5eApplyHealingHandler(params: ApplyHealingParams): Promise<HitPointsChangeResult> {
  requireSystem('dnd5e', 'dnd5e/apply-healing');

  const parsed = applyHealingRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toApplyHealingCommand(parsed.data);
  const service = createDnd5eHitPointsService({
    hitPoints: new Dnd5eHitPointsGateway(getDnd5eHitPointsGame())
  });

  return toHitPointsChangeResult(await service.applyHealing(command));
}
