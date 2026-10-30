import type { Coc7LuckParams, Coc7LuckResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import { createCoc7LuckService, Coc7LuckGateway, getCoc7LuckGame, luckRequestSchema, RequestToCommandMapper } from '@/systems/coc7/luck';
import { toCoc7LuckResult } from './coc7Mappers';

export async function coc7LuckHandler(params: Coc7LuckParams): Promise<Coc7LuckResult> {
  requireSystem('CoC7', 'coc7/luck');

  const parsed = luckRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toLuckCommand(parsed.data);
  const service = createCoc7LuckService({ luck: new Coc7LuckGateway(getCoc7LuckGame()) });

  return toCoc7LuckResult(await service.luck(command));
}
