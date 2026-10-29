import { getSwadeGame, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';

export type FoundrySwadeBenniesGame = FoundrySwadeGame;

export function getSwadeBenniesGame(): FoundrySwadeBenniesGame {
  return getSwadeGame();
}
