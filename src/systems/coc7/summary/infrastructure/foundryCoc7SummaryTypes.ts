import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7SummaryGame = FoundryCoc7Game;

export function getCoc7SummaryGame(): FoundryCoc7SummaryGame {
  return getCoc7Game();
}
