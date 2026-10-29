import { getSwadeGame, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';

/** The slice's view of the Foundry globals: the shared SWADE game shape. */
export type FoundrySwadeRollGame = FoundrySwadeGame;

export function getSwadeRollGame(): FoundrySwadeRollGame {
  return getSwadeGame();
}
