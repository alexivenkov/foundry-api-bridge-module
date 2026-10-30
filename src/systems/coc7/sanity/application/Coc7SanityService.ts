import type { Coc7BoutOfMadnessOutcome, Coc7SanityCheckOutcome, Coc7SanityPort } from '@/systems/coc7/sanity/domain';
import type { BoutOfMadnessCommand, SanityCheckCommand } from './SanityCommands';

export class Coc7SanityService {
  constructor(private readonly sanity: Coc7SanityPort) {}

  async sanityCheck(command: SanityCheckCommand): Promise<Coc7SanityCheckOutcome> {
    return this.sanity.sanityCheck(command.target, {
      lossPassed: command.lossPassed,
      lossFailed: command.lossFailed,
      reason: command.reason,
      difficulty: command.difficulty,
      bonusDice: command.bonusDice,
      penaltyDice: command.penaltyDice,
      apply: command.apply,
      showInChat: command.showInChat
    });
  }

  async boutOfMadness(command: BoutOfMadnessCommand): Promise<Coc7BoutOfMadnessOutcome> {
    return this.sanity.boutOfMadness(command.target, { realTime: command.realTime, duration: command.duration });
  }
}
