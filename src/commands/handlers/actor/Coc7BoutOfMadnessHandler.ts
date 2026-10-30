import type { Coc7BoutOfMadnessParams, Coc7BoutOfMadnessResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createCoc7SanityService,
  Coc7SanityGateway,
  getCoc7SanityGame,
  boutOfMadnessRequestSchema,
  RequestToCommandMapper
} from '@/systems/coc7/sanity';
import { toCoc7BoutOfMadnessResult } from './coc7Mappers';

export async function coc7BoutOfMadnessHandler(params: Coc7BoutOfMadnessParams): Promise<Coc7BoutOfMadnessResult> {
  requireSystem('CoC7', 'coc7/bout-of-madness');

  const parsed = boutOfMadnessRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toBoutOfMadnessCommand(parsed.data);
  const service = createCoc7SanityService({ sanity: new Coc7SanityGateway(getCoc7SanityGame()) });

  return toCoc7BoutOfMadnessResult(await service.boutOfMadness(command));
}
