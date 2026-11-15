import type { Pf1UseItemParams, Pf1UseItemResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requirePf1 } from '@/systems/pf1/shared/infrastructure';
import {
  createPf1ItemUseService,
  Pf1ItemUseGateway,
  getPf1ItemUseGame,
  useItemRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf1/item-use';
import { toPf1UseItemResult } from '@/commands/handlers/actor/pf1Mappers';

export async function pf1UseItemHandler(params: Pf1UseItemParams): Promise<Pf1UseItemResult> {
  requirePf1('pf1/use-item');

  const parsed = useItemRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toUseItemCommand(parsed.data);
  const service = createPf1ItemUseService({ items: new Pf1ItemUseGateway(getPf1ItemUseGame()) });

  return toPf1UseItemResult(await service.useItem(command));
}
