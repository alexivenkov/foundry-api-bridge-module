import type { Coc7CheckResult, Coc7RollCharacteristicParams } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7CheckService,
  Coc7CheckGateway,
  getCoc7CheckGame,
  rollCharacteristicRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/checks';
import { toCoc7CheckResult } from './coc7Mappers';

export async function coc7RollCharacteristicHandler(params: Coc7RollCharacteristicParams): Promise<Coc7CheckResult> {
  requireSystem('CoC7', 'coc7/roll-characteristic');

  const parsed = rollCharacteristicRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toRollCharacteristicCommand(parsed.data);
  const service = createCoc7CheckService({ checks: new Coc7CheckGateway(getCoc7CheckGame()) });

  return toCoc7CheckResult(await service.rollCharacteristic(command));
}
