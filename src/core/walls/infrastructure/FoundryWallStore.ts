import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type { Wall, WallChanges, WallDraft, WallStore } from '@/core/walls/domain';
import type { FoundryWallGame, FoundryWallScene } from './foundryWallTypes';
import { toFoundryWallData, toWall } from './wallMapper';

export type WallGameProvider = GameProvider<FoundryWallGame>;

/** Anti-corruption layer over a scene's embedded Wall documents. */
export class FoundryWallStore implements WallStore {
  constructor(private readonly gameProvider: WallGameProvider) {}

  listWalls(sceneId: string): readonly Wall[] {
    return this.requireScene(sceneId).walls.contents.map(toWall);
  }

  findWall(sceneId: string, wallId: string): Wall | null {
    const document = this.requireScene(sceneId).walls.get(wallId);
    return document !== undefined ? toWall(document) : null;
  }

  async createWall(sceneId: string, draft: WallDraft): Promise<Wall | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('Wall', [toFoundryWallData(draft)]);
    const document = created[0];
    return document !== undefined ? toWall(document) : null;
  }

  async updateWall(sceneId: string, wallId: string, changes: WallChanges): Promise<Wall | null> {
    const document = this.requireScene(sceneId).walls.get(wallId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryWallData(changes, document));
    return toWall(document);
  }

  async deleteWall(sceneId: string, wallId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('Wall', [wallId]);
  }

  private requireScene(sceneId: string): FoundryWallScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
