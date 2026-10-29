import type { SwadeActorSummary, SwadeSummaryPort } from '@/systems/swade/summary/domain';
import type { GetActorSummaryCommand } from './SummaryCommands';

export class SwadeSummaryService {
  constructor(private readonly summaries: SwadeSummaryPort) {}

  async getSummary(command: GetActorSummaryCommand): Promise<SwadeActorSummary> {
    return this.summaries.getSummary(command.target);
  }
}
