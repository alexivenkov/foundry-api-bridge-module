import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type {
  AmbientSound,
  AmbientSoundChanges,
  AmbientSoundDraft,
  AmbientSoundStore
} from '@/core/ambient-sounds/domain';
import { toAmbientSound, toFoundryAmbientSoundData } from './ambientSoundMapper';
import type {
  FoundryAmbientSoundDocument,
  FoundryAmbientSoundGame,
  FoundryAmbientSoundScene
} from './foundryAmbientSoundTypes';
import { soundFeaturesFor } from './soundFeatures';

export type AmbientSoundGameProvider = GameProvider<FoundryAmbientSoundGame>;

/** Anti-corruption layer over a scene's embedded AmbientSound documents (`Scene#sounds`). */
export class FoundryAmbientSoundStore implements AmbientSoundStore {
  constructor(
    private readonly gameProvider: AmbientSoundGameProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  listAmbientSounds(sceneId: string): readonly AmbientSound[] {
    return this.requireScene(sceneId).sounds.contents.map((document) => this.toAmbientSound(document));
  }

  findAmbientSound(sceneId: string, ambientSoundId: string): AmbientSound | null {
    const document = this.requireScene(sceneId).sounds.get(ambientSoundId);
    return document !== undefined ? this.toAmbientSound(document) : null;
  }

  async createAmbientSound(sceneId: string, draft: AmbientSoundDraft): Promise<AmbientSound | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('AmbientSound', [
      toFoundryAmbientSoundData(draft)
    ]);
    const document = created[0];
    return document !== undefined ? this.toAmbientSound(document) : null;
  }

  async updateAmbientSound(
    sceneId: string,
    ambientSoundId: string,
    changes: AmbientSoundChanges
  ): Promise<AmbientSound | null> {
    const document = this.requireScene(sceneId).sounds.get(ambientSoundId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryAmbientSoundData(changes));
    return this.toAmbientSound(document);
  }

  async deleteAmbientSound(sceneId: string, ambientSoundId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('AmbientSound', [ambientSoundId]);
  }

  listSceneLevelIds(sceneId: string): readonly string[] {
    return this.requireScene(sceneId).levels?.contents.map((level) => level.id) ?? [];
  }

  private toAmbientSound(document: FoundryAmbientSoundDocument): AmbientSound {
    return toAmbientSound(document, soundFeaturesFor(this.generation()));
  }

  private requireScene(sceneId: string): FoundryAmbientSoundScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
