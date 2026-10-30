import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7ConditionGame = FoundryCoc7Game;

export function getCoc7ConditionGame(): FoundryCoc7ConditionGame {
  return getCoc7Game();
}
