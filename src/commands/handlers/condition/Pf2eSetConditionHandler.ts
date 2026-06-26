import type { SetConditionParams, ConditionMutationResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eConditionService,
  Pf2eConditionGateway,
  getPf2eConditionGame,
  setConditionRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/conditions';
import { toMutationResult } from './conditionMappers';

export async function pf2eSetConditionHandler(
  params: SetConditionParams
): Promise<ConditionMutationResult> {
  requireSystem('pf2e', 'pf2e/set-condition');

  const parsed = setConditionRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toSetConditionCommand(parsed.data);

  const gateway = new Pf2eConditionGateway(getPf2eConditionGame());
  const service = createPf2eConditionService({ conditions: gateway });

  const outcome = await service.setCondition(command);
  return toMutationResult(outcome);
}
