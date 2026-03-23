import type { WorldDataCollector } from '@/collectors/WorldDataCollector';
import type { ApiClient } from '@/api/ApiClient';
import { ApiError } from '@/api/ApiClient';

const BACKOFF_RATE_LIMIT = 3;
const BACKOFF_SERVER_DOWN = 6;

export class UpdateLoop {
  private running = false;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private interval: number,
    private collector: WorldDataCollector,
    private apiClient: ApiClient,
    private endpoint: string
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    console.log(`Foundry API Bridge | Update loop started (interval: ${String(this.interval)}ms)`);
    void this.loop();
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.abortController?.abort();
    this.abortController = null;

    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }

    console.log('Foundry API Bridge | Update loop stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  private async loop(): Promise<void> {
    while (this.running) {
      const delay = await this.sendUpdate();

      if (!this.running) break;

      await this.sleep(delay);
    }
  }

  private async sendUpdate(): Promise<number> {
    try {
      const data = this.collector.collect();
      this.abortController = new AbortController();
      await this.apiClient.sendWorldData(this.endpoint, data, this.abortController.signal);
      this.abortController = null;
      return this.interval;
    } catch (error: unknown) {
      this.abortController = null;

      if (error instanceof DOMException && error.name === 'AbortError') {
        return this.interval;
      }

      if (error instanceof ApiError) {
        const status = error.status;

        if (status === 429) {
          const delay = this.interval * BACKOFF_RATE_LIMIT;
          console.warn(`Foundry API Bridge | Rate limited (429). Next update in ${String(delay / 1000)}s`);
          return delay;
        }

        if (status === 502 || status === 503) {
          const delay = this.interval * BACKOFF_SERVER_DOWN;
          console.warn(`Foundry API Bridge | Server unavailable (${String(status)}). Next update in ${String(delay / 1000)}s`);
          return delay;
        }
      }

      const isNetworkError = !(error instanceof ApiError);
      if (isNetworkError) {
        const delay = this.interval * BACKOFF_SERVER_DOWN;
        console.error('Foundry API Bridge | Failed to send world data:', error instanceof Error ? error.message : String(error));
        console.warn(`Foundry API Bridge | Network error. Next update in ${String(delay / 1000)}s`);
        return delay;
      }

      console.error('Foundry API Bridge | Failed to send world data:', error instanceof Error ? error.message : String(error));
      return this.interval;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.sleepTimer = setTimeout(() => {
        this.sleepTimer = null;
        resolve();
      }, ms);
    });
  }
}
