import { getSwadeGame, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';

export type FoundrySwadeCombatGame = FoundrySwadeGame;

export function getSwadeCombatGame(): FoundrySwadeCombatGame {
  return getSwadeGame();
}
