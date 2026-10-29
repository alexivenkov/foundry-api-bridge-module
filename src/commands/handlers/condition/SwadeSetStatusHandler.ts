import type { SwadeSetStatusParams, SwadeSetStatusResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeStatusService,
  SwadeStatusGateway,
  getSwadeStatusGame,
  setStatusRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/status';

export async function swadeSetStatusHandler(params: SwadeSetStatusParams): Promise<SwadeSetStatusResult> {
  requireSystem('swade', 'swade/set-status');

  const parsed = setStatusRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toSetStatusCommand(parsed.data);
  const service = createSwadeStatusService({ statuses: new SwadeStatusGateway(getSwadeStatusGame()) });

  const outcome = await service.setStatus(command);
  const result: SwadeSetStatusResult = {
    actorId: outcome.actorId,
    status: outcome.status,
    active: outcome.active,
    statuses: [...outcome.statuses]
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}
