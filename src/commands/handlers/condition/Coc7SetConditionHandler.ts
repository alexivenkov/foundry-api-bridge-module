import type { Coc7SetConditionParams, Coc7SetConditionResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7ConditionService,
  Coc7ConditionGateway,
  getCoc7ConditionGame,
  setConditionRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/conditions';
import { toCoc7SetConditionResult } from '@/commands/handlers/actor/coc7Mappers';

export async function coc7SetConditionHandler(params: Coc7SetConditionParams): Promise<Coc7SetConditionResult> {
  requireSystem('CoC7', 'coc7/set-condition');

  const parsed = setConditionRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toSetConditionCommand(parsed.data);
  const service = createCoc7ConditionService({ conditions: new Coc7ConditionGateway(getCoc7ConditionGame()) });

  return toCoc7SetConditionResult(await service.setCondition(command));
}
