import { getPf1Game, type FoundryPf1Game } from '@/systems/pf1/shared/infrastructure';

/** The slice's view of the Foundry globals: the shared PF1 game shape. */
export type FoundryPf1ConditionGame = FoundryPf1Game;

export function getPf1ConditionGame(): FoundryPf1ConditionGame {
  return getPf1Game();
}
