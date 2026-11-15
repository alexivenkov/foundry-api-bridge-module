import type { GamePause } from '@/core/world/domain';

export interface GamePauseServiceDependencies {
  readonly pause: GamePause;
}

export class GamePauseService {
  constructor(private readonly deps: GamePauseServiceDependencies) {}

  isPaused(): boolean {
    return this.deps.pause.isPaused();
  }

  pause(): void {
    this.deps.pause.setPaused(true);
  }

  resume(): void {
    this.deps.pause.setPaused(false);
  }
}
