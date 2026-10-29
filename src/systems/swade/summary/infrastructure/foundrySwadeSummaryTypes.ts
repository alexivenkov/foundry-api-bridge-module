import { getSwadeGame, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';

export type FoundrySwadeSummaryGame = FoundrySwadeGame;

export function getSwadeSummaryGame(): FoundrySwadeSummaryGame {
  return getSwadeGame();
}
