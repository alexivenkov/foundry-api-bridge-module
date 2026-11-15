import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type { Light, LightChanges, LightDraft, LightStore } from '@/core/lights/domain';
import type { FoundryLightDocument, FoundryLightGame, FoundryLightScene } from './foundryLightTypes';
import { lightFeaturesFor } from './lightFeatures';
import { toFoundryLightData, toLight } from './lightMapper';

export type LightGameProvider = GameProvider<FoundryLightGame>;

/** Anti-corruption layer over a scene's embedded AmbientLight documents. */
export class FoundryLightStore implements LightStore {
  constructor(
    private readonly gameProvider: LightGameProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  listLights(sceneId: string): readonly Light[] {
    return this.requireScene(sceneId).lights.contents.map((document) => this.toLight(document));
  }

  findLight(sceneId: string, lightId: string): Light | null {
    const document = this.requireScene(sceneId).lights.get(lightId);
    return document !== undefined ? this.toLight(document) : null;
  }

  async createLight(sceneId: string, draft: LightDraft): Promise<Light | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('AmbientLight', [
      toFoundryLightData(draft)
    ]);
    const document = created[0];
    return document !== undefined ? this.toLight(document) : null;
  }

  async updateLight(sceneId: string, lightId: string, changes: LightChanges): Promise<Light | null> {
    const document = this.requireScene(sceneId).lights.get(lightId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryLightData(changes));
    return this.toLight(document);
  }

  async deleteLight(sceneId: string, lightId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('AmbientLight', [lightId]);
  }

  listSceneLevelIds(sceneId: string): readonly string[] {
    return this.requireScene(sceneId).levels?.contents.map((level) => level.id) ?? [];
  }

  private toLight(document: FoundryLightDocument): Light {
    return toLight(document, lightFeaturesFor(this.generation()));
  }

  private requireScene(sceneId: string): FoundryLightScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
