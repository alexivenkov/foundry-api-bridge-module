import type { WorldDataCollector } from '@/collectors/WorldDataCollector';
import type { ApiClient } from '@/api/ApiClient';

export class UpdateLoop {
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private interval: number,
    private collector: WorldDataCollector,
    private apiClient: ApiClient,
    private endpoint: string
  ) {}

  start(): void {
    if (this.timerId !== null) {
      return;
    }

    this.sendUpdate();

    this.timerId = setInterval(() => {
      this.sendUpdate();
    }, this.interval);

    console.log(`Update loop started (interval: ${String(this.interval)}ms)`);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log('Update loop stopped');
    }
  }

  isRunning(): boolean {
    return this.timerId !== null;
  }

  private sendUpdate(): void {
    const data = this.collector.collect();
    this.apiClient.sendWorldData(this.endpoint, data).catch((error: unknown) => {
      console.error("Failed to send world data:", error instanceof Error ? error.message : String(error));
    });
  }
}
