import type { SwadeBenniesParams, SwadeBenniesResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeBenniesService,
  SwadeBenniesGateway,
  getSwadeBenniesGame,
  benniesRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/bennies';
import { toSwadeBenniesResult } from './swadeMappers';

export async function swadeBenniesHandler(params: SwadeBenniesParams): Promise<SwadeBenniesResult> {
  requireSystem('swade', 'swade/bennies');

  const parsed = benniesRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toBenniesCommand(parsed.data);
  const service = createSwadeBenniesService({ bennies: new SwadeBenniesGateway(getSwadeBenniesGame()) });

  return toSwadeBenniesResult(await service.apply(command));
}
