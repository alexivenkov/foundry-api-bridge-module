import type { Pf1ActorSummary, Pf1SummaryPort } from '@/systems/pf1/summary/domain';
import type { GetSummaryCommand } from './SummaryCommands';

export class Pf1SummaryService {
  constructor(private readonly summary: Pf1SummaryPort) {}

  async getSummary(command: GetSummaryCommand): Promise<Pf1ActorSummary> {
    return this.summary.getSummary(command.target);
  }
}
