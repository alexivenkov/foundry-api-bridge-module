import type { Coc7LuckOutcome, Coc7LuckPort } from '@/systems/coc7/luck/domain';
import type { LuckCommand } from './LuckCommands';

export class Coc7LuckService {
  constructor(private readonly luckPort: Coc7LuckPort) {}

  async luck(command: LuckCommand): Promise<Coc7LuckOutcome> {
    return this.luckPort.luck(command.target, { action: command.action, amount: command.amount });
  }
}
