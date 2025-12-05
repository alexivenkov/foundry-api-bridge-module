import type { DeleteTokenParams, DeleteResult } from '@/commands/types';
import { getActiveScene, getToken, type FoundryGame } from './tokenTypes';

declare const game: FoundryGame;

export async function deleteTokenHandler(params: DeleteTokenParams): Promise<DeleteResult> {
  const scene = getActiveScene(game, params.sceneId);
  const token = getToken(scene, params.tokenId);

  await token.delete();

  return { deleted: true };
}