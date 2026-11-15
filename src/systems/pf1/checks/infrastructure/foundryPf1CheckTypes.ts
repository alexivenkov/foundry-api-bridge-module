import { getPf1Game, type FoundryPf1Game } from '@/systems/pf1/shared/infrastructure';

/** The slice's view of the Foundry globals: the shared PF1 game shape. */
export type FoundryPf1CheckGame = FoundryPf1Game;

export function getPf1CheckGame(): FoundryPf1CheckGame {
  return getPf1Game();
}
