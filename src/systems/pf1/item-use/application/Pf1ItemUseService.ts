import type { Pf1ItemUsePort, Pf1UseItemOutcome } from '@/systems/pf1/item-use/domain';
import type { UseItemCommand } from './ItemUseCommands';

export class Pf1ItemUseService {
  constructor(private readonly items: Pf1ItemUsePort) {}

  async useItem(command: UseItemCommand): Promise<Pf1UseItemOutcome> {
    return this.items.useItem(command.target, command.item, command.options);
  }
}
