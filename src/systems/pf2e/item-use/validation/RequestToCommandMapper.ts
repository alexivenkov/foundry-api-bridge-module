import type {
  UseConsumableCommand,
  CastSpellCommand,
  PostItemCommand
} from '@/systems/pf2e/item-use/application';
import type {
  UseConsumableRequest,
  CastSpellRequest,
  PostItemRequest
} from './ItemUseRequestSchemas';

export const RequestToCommandMapper = {
  toUseConsumableCommand(request: UseConsumableRequest): UseConsumableCommand {
    return {
      actorId: request.actorId,
      itemId: request.itemId,
      quantity: request.quantity ?? 1
    };
  },
  toCastSpellCommand(request: CastSpellRequest): CastSpellCommand {
    return {
      actorId: request.actorId,
      spellId: request.spellId,
      rank: request.rank,
      showInChat: request.showInChat ?? true
    };
  },
  toPostItemCommand(request: PostItemRequest): PostItemCommand {
    return {
      actorId: request.actorId,
      itemId: request.itemId,
      showInChat: request.showInChat ?? true
    };
  }
};
