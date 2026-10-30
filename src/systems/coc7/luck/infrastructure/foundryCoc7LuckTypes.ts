import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7LuckGame = FoundryCoc7Game;

export function getCoc7LuckGame(): FoundryCoc7LuckGame {
  return getCoc7Game();
}
