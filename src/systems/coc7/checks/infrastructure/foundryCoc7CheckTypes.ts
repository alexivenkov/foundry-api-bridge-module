import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7CheckGame = FoundryCoc7Game;

export function getCoc7CheckGame(): FoundryCoc7CheckGame {
  return getCoc7Game();
}
