import type { ConditionSlugParams, ConditionMutationResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eConditionService,
  Pf2eConditionGateway,
  getPf2eConditionGame,
  conditionSlugRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/conditions';
import { toMutationResult } from './conditionMappers';

export async function pf2eDecreaseConditionHandler(
  params: ConditionSlugParams
): Promise<ConditionMutationResult> {
  requireSystem('pf2e', 'pf2e/decrease-condition');

  const parsed = conditionSlugRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toConditionSlugCommand(parsed.data);

  const gateway = new Pf2eConditionGateway(getPf2eConditionGame());
  const service = createPf2eConditionService({ conditions: gateway });

  const outcome = await service.decreaseCondition(command);
  return toMutationResult(outcome);
}
