import type { UseConsumableParams, UseConsumableResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eItemUseService,
  Pf2eItemUseGateway,
  getPf2eItemUseGame,
  useConsumableRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/item-use';

export async function pf2eUseConsumableHandler(
  params: UseConsumableParams
): Promise<UseConsumableResult> {
  requireSystem('pf2e', 'pf2e/use-consumable');

  const parsed = useConsumableRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toUseConsumableCommand(parsed.data);

  const gateway = new Pf2eItemUseGateway(getPf2eItemUseGame());
  const service = createPf2eItemUseService({ itemUse: gateway });

  const outcome = await service.useConsumable(command);
  return {
    itemId: outcome.itemId,
    itemName: outcome.itemName,
    consumed: true,
    remainingUses: outcome.remainingUses,
    remainingQuantity: outcome.remainingQuantity
  };
}
