import { TargetTokenNotFoundError } from '@/systems/shared/domain/errors';
import type { TargetingPort } from '@/systems/dnd5e/item-actions/domain';
import { getGame, getCanvas } from './foundryItemActionTypes';

/**
 * Anti-corruption layer for token targeting over the Foundry / dnd5e canvas.
 */
export class Dnd5eTargetingGateway implements TargetingPort {
  setTargets(tokenIds: readonly string[]): number {
    const game = getGame();
    const canvas = getCanvas();

    for (const existing of game.user.targets) {
      existing.setTarget(false, { user: game.user, releaseOthers: false });
    }

    let count = 0;
    for (const tokenId of tokenIds) {
      const token = canvas.tokens.get(tokenId);
      if (!token) {
        throw new TargetTokenNotFoundError(tokenId);
      }
      token.setTarget(true, { user: game.user, releaseOthers: false });
      count += 1;
    }
    return count;
  }
}
