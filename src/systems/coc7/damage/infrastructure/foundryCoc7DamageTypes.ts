import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7DamageGame = FoundryCoc7Game;

export function getCoc7DamageGame(): FoundryCoc7DamageGame {
  return getCoc7Game();
}
