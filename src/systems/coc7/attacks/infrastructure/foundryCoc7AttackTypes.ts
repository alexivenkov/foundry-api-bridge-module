import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7AttackGame = FoundryCoc7Game;

export function getCoc7AttackGame(): FoundryCoc7AttackGame {
  return getCoc7Game();
}
