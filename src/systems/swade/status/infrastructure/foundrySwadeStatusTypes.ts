import { getSwadeGame, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';

export type FoundrySwadeStatusGame = FoundrySwadeGame;

export function getSwadeStatusGame(): FoundrySwadeStatusGame {
  return getSwadeGame();
}
