import type { Coc7SanityCheckParams, Coc7SanityCheckResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7SanityService,
  Coc7SanityGateway,
  getCoc7SanityGame,
  sanityCheckRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/sanity';
import { toCoc7SanityCheckResult } from './coc7Mappers';

export async function coc7SanityCheckHandler(params: Coc7SanityCheckParams): Promise<Coc7SanityCheckResult> {
  requireSystem('CoC7', 'coc7/sanity-check');

  const parsed = sanityCheckRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toSanityCheckCommand(parsed.data);
  const service = createCoc7SanityService({ sanity: new Coc7SanityGateway(getCoc7SanityGame()) });

  return toCoc7SanityCheckResult(await service.sanityCheck(command));
}
