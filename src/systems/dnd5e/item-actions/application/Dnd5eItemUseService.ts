import type { ItemUsePort, UseItemOutcome } from '@/systems/dnd5e/item-actions/domain';
import type { UseItemCommand } from './ItemActionCommands';

export class Dnd5eItemUseService {
  constructor(private readonly itemUse: ItemUsePort) {}

  async useItem(command: UseItemCommand): Promise<UseItemOutcome> {
    return this.itemUse.use(command.actorId, command.itemId, {
      activityId: command.activityId,
      activityType: command.activityType,
      consume: command.consume,
      scaling: command.scaling,
      showInChat: command.showInChat
    });
  }
}
