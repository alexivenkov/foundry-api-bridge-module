import type { Coc7ActorSummaryOutcome, Coc7SummaryPort } from '@/systems/coc7/summary/domain';
import type { GetActorSummaryCommand } from './SummaryCommands';

export class Coc7SummaryService {
  constructor(private readonly summaries: Coc7SummaryPort) {}

  async getSummary(command: GetActorSummaryCommand): Promise<Coc7ActorSummaryOutcome> {
    return this.summaries.getSummary(command.target);
  }
}
