import type { CanvasViewport } from '@/core/ui/domain';
import type { PanCanvasCommand, PingLocationCommand } from './commands';

export interface CanvasViewServiceDependencies {
  readonly viewport: CanvasViewport;
}

export class CanvasViewService {
  constructor(private readonly deps: CanvasViewServiceDependencies) {}

  async panCanvas(command: PanCanvasCommand): Promise<void> {
    await this.deps.viewport.pan(command.pan);
  }

  /** Resolves to whether the canvas took the ping. */
  async pingLocation(command: PingLocationCommand): Promise<boolean> {
    return this.deps.viewport.ping(command.ping);
  }
}
