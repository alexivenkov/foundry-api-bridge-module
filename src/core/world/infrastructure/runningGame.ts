import type { GameProvider } from '@/core/shared';
import { GameNotAvailableError } from '@/core/world/domain';
import type { FoundryRunningGame } from './foundryWorldTypes';

export type RunningGameProvider = GameProvider<FoundryRunningGame>;

/** Unlike the other contexts, time and pause commands answer `Game not available` when asked too early. */
export function readRunningGame(): FoundryRunningGame {
  const game = (globalThis as { game?: FoundryRunningGame }).game;
  if (!game) {
    throw new GameNotAvailableError();
  }
  return game;
}

export const runningGameProvider: RunningGameProvider = { getGame: readRunningGame };
