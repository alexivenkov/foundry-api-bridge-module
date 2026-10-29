import type { SwadeSetStatusOutcome, SwadeStatusPort } from '@/systems/swade/status/domain';
import type { SetStatusCommand } from './StatusCommands';

export class SwadeStatusService {
  constructor(private readonly statuses: SwadeStatusPort) {}

  async setStatus(command: SetStatusCommand): Promise<SwadeSetStatusOutcome> {
    return this.statuses.setStatus(command.target, {
      status: command.status,
      active: command.active,
      overlay: command.overlay
    });
  }
}
