import type { Coc7CheckResult, Coc7RollAttributeParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7CheckService,
  Coc7CheckGateway,
  getCoc7CheckGame,
  rollAttributeRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/checks';
import { toCoc7CheckResult } from './coc7Mappers';

export async function coc7RollAttributeHandler(params: Coc7RollAttributeParams): Promise<Coc7CheckResult> {
  requireSystem('CoC7', 'coc7/roll-attribute');

  const parsed = rollAttributeRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollAttributeCommand(parsed.data);
  const service = createCoc7CheckService({ checks: new Coc7CheckGateway(getCoc7CheckGame()) });

  return toCoc7CheckResult(await service.rollAttribute(command));
}
