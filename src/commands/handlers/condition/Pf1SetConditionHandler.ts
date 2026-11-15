import type { Pf1SetConditionParams, Pf1SetConditionResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { getPf1Registry, requirePf1 } from '@/systems/pf1/shared/infrastructure';
import {
  createPf1ConditionService,
  Pf1ConditionGateway,
  getPf1ConditionGame,
  setConditionRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf1/conditions';
import { toPf1SetConditionResult } from '@/commands/handlers/actor/pf1Mappers';

export async function pf1SetConditionHandler(params: Pf1SetConditionParams): Promise<Pf1SetConditionResult> {
  requirePf1('pf1/set-condition');

  const parsed = setConditionRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toSetConditionCommand(parsed.data);
  const service = createPf1ConditionService({
    conditions: new Pf1ConditionGateway(getPf1ConditionGame(), getPf1Registry())
  });

  return toPf1SetConditionResult(await service.setCondition(command));
}
