import type {
  ConsumableUseOutcome,
  SpellCastOutcome,
  ItemPostOutcome,
  Pf2eItemUsePort
} from '@/systems/pf2e/item-use/domain';
import type {
  UseConsumableCommand,
  CastSpellCommand,
  PostItemCommand
} from './ItemUseCommands';

export class Pf2eItemUseService {
  constructor(private readonly itemUse: Pf2eItemUsePort) {}

  async useConsumable(command: UseConsumableCommand): Promise<ConsumableUseOutcome> {
    return this.itemUse.useConsumable(command.actorId, command.itemId, command.quantity);
  }

  async castSpell(command: CastSpellCommand): Promise<SpellCastOutcome> {
    return this.itemUse.castSpell(command.actorId, command.spellId, command.rank, {
      showInChat: command.showInChat
    });
  }

  async postItem(command: PostItemCommand): Promise<ItemPostOutcome> {
    return this.itemUse.postItem(command.actorId, command.itemId, {
      showInChat: command.showInChat
    });
  }
}
