import type { PostItemParams, PostItemResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eItemUseService,
  Pf2eItemUseGateway,
  getPf2eItemUseGame,
  postItemRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/item-use';

export async function pf2ePostItemHandler(params: PostItemParams): Promise<PostItemResult> {
  requireSystem('pf2e', 'pf2e/post-item');

  const parsed = postItemRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toPostItemCommand(parsed.data);

  const gateway = new Pf2eItemUseGateway(getPf2eItemUseGame());
  const service = createPf2eItemUseService({ itemUse: gateway });

  const outcome = await service.postItem(command);
  return {
    itemId: outcome.itemId,
    itemName: outcome.itemName,
    itemType: outcome.itemType,
    posted: true,
    chatMessageId: outcome.chatMessageId
  };
}
