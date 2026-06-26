import type { GetConditionsParams, ConditionListResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eConditionService,
  Pf2eConditionGateway,
  getPf2eConditionGame,
  getConditionsRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/conditions';
import { toListResult } from './conditionMappers';

export async function pf2eGetConditionsHandler(
  params: GetConditionsParams
): Promise<ConditionListResult> {
  requireSystem('pf2e', 'pf2e/get-conditions');

  const parsed = getConditionsRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toGetConditionsCommand(parsed.data);

  const gateway = new Pf2eConditionGateway(getPf2eConditionGame());
  const service = createPf2eConditionService({ conditions: gateway });

  const outcome = await service.getConditions(command);
  return toListResult(outcome);
}
