import { getPf1Game, type FoundryPf1Game } from '@/systems/pf1/shared/infrastructure';

/** The slice's view of the Foundry globals: the shared PF1 game shape. */
export type FoundryPf1DamageGame = FoundryPf1Game;

export function getPf1DamageGame(): FoundryPf1DamageGame {
  return getPf1Game();
}
