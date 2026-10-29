import type { SwadeSoakParams, SwadeSoakResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createSwadeDamageService,
  SwadeDamageGateway,
  getSwadeDamageGame,
  soakRequestSchema,
  RequestToCommandMapper
} from '@/systems/swade/damage';
import { toSwadeSoakResult } from './swadeMappers';

export async function swadeSoakHandler(params: SwadeSoakParams): Promise<SwadeSoakResult> {
  requireSystem('swade', 'swade/soak');

  const parsed = soakRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toSoakCommand(parsed.data);
  const service = createSwadeDamageService({ damage: new SwadeDamageGateway(getSwadeDamageGame()) });

  return toSwadeSoakResult(await service.soak(command));
}
