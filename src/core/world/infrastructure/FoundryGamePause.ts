import type { GamePause } from '@/core/world/domain';
import type { RunningGameProvider } from './runningGame';

export class FoundryGamePause implements GamePause {
  constructor(private readonly gameProvider: RunningGameProvider) {}

  isPaused(): boolean {
    return this.gameProvider.getGame().paused;
  }

  /** Broadcast, so the game pauses for every connected client and not only in the GM's browser. */
  setPaused(paused: boolean): void {
    this.gameProvider.getGame().togglePause(paused, { broadcast: true });
  }
}
