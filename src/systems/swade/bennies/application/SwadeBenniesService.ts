import type { SwadeBenniesOutcome, SwadeBenniesPort } from '@/systems/swade/bennies/domain';
import type { BenniesCommand } from './BenniesCommands';

export class SwadeBenniesService {
  constructor(private readonly bennies: SwadeBenniesPort) {}

  async apply(command: BenniesCommand): Promise<SwadeBenniesOutcome> {
    if (command.target === undefined) {
      return this.bennies.gmBennies(command.action);
    }
    return this.bennies.actorBennies(command.target, command.action);
  }
}
