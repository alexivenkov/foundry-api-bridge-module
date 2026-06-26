import type { RollOutcome } from '@/systems/shared/domain';
import type { Pf2eStrikePort, StrikeListOutcome } from '@/systems/pf2e/strikes/domain';
import type {
  ListStrikesCommand,
  RollStrikeCommand,
  RollStrikeDamageCommand
} from './StrikeCommands';

export class Pf2eStrikeService {
  constructor(private readonly strikes: Pf2eStrikePort) {}

  async listStrikes(command: ListStrikesCommand): Promise<StrikeListOutcome> {
    return this.strikes.listStrikes(command.actorId);
  }

  async rollStrike(command: RollStrikeCommand): Promise<RollOutcome> {
    return this.strikes.rollStrike(command.actorId, command.slug, command.mapIncrease, {
      showInChat: command.showInChat
    });
  }

  async rollStrikeDamage(command: RollStrikeDamageCommand): Promise<RollOutcome> {
    return this.strikes.rollStrikeDamage(command.actorId, command.slug, command.critical, {
      showInChat: command.showInChat
    });
  }
}
