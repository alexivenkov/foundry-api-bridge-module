import { getSwadeGame, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';

export type FoundrySwadeDamageGame = FoundrySwadeGame;

export function getSwadeDamageGame(): FoundrySwadeDamageGame {
  return getSwadeGame();
}
