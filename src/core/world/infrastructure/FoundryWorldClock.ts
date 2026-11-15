import type { WorldClock } from '@/core/world/domain';
import type { RunningGameProvider } from './runningGame';

export class FoundryWorldClock implements WorldClock {
  constructor(private readonly gameProvider: RunningGameProvider) {}

  now(): number {
    return this.gameProvider.getGame().time.worldTime;
  }

  async advance(seconds: number): Promise<void> {
    await this.gameProvider.getGame().time.advance(seconds);
  }

  async set(worldTime: number): Promise<void> {
    await this.gameProvider.getGame().time.set(worldTime);
  }
}
