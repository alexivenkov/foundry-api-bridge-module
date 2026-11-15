import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type { FoundrySceneDocument, FoundrySceneGame } from './foundrySceneTypes';

export type SceneGameProvider = GameProvider<FoundrySceneGame>;

export function requireSceneDocument(gameProvider: SceneGameProvider, sceneId: string): FoundrySceneDocument {
  const document = findFoundryScene(gameProvider.getGame().scenes, sceneId);
  if (document === undefined) {
    throw new SceneNotFoundError(sceneId);
  }
  return document;
}
