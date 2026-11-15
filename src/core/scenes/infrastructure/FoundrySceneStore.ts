import type {
  ConfiguredScene,
  ConfiguredSceneStore,
  CreatedConfiguredScene,
  Scene,
  SceneChanges,
  SceneCloneOverrides,
  SceneDraft,
  SceneNavigator,
  SceneStore,
  SceneUpdateOptions
} from '@/core/scenes/domain';
import type { FoundrySceneClass, FoundrySceneDocument } from './foundrySceneTypes';
import { requireSceneDocument, type SceneGameProvider } from './sceneDocuments';
import {
  missingSceneImages,
  toFoundryCloneData,
  toFoundrySceneData,
  toFoundrySceneUpdateData,
  toScene
} from './sceneMapper';
import { toSceneSettings } from './sceneSettingsMapper';

/** Reads the `Scene` document class on every call: it does not exist before Foundry is ready. */
export type SceneClassProvider = () => FoundrySceneClass;

const sceneClassFromGlobalThis: SceneClassProvider = () =>
  (globalThis as unknown as { Scene: FoundrySceneClass }).Scene;

function toConfiguredScene(document: FoundrySceneDocument): ConfiguredScene {
  return { scene: toScene(document), settings: toSceneSettings(document) };
}

/** Anti-corruption layer over the world's Scene documents. */
export class FoundrySceneStore implements SceneStore, ConfiguredSceneStore, SceneNavigator {
  constructor(
    private readonly gameProvider: SceneGameProvider,
    private readonly sceneClass: SceneClassProvider = sceneClassFromGlobalThis
  ) {}

  async createConfiguredScene(draft: SceneDraft): Promise<CreatedConfiguredScene | null> {
    const created = await this.sceneClass().create(toFoundrySceneData(draft));
    return created ? { ...toConfiguredScene(created), missingImages: missingSceneImages(draft, created) } : null;
  }

  /** `animateDarkness` is an update option the core passes on to every client's `Scene#_onUpdate`. */
  async updateConfiguredScene(
    sceneId: string,
    changes: SceneChanges,
    options?: SceneUpdateOptions
  ): Promise<ConfiguredScene> {
    const document = requireSceneDocument(this.gameProvider, sceneId);
    const data = toFoundrySceneUpdateData(changes, document);
    if (options?.darknessAnimationMs === undefined) {
      await document.update(data);
    } else {
      await document.update(data, { animateDarkness: options.darknessAnimationMs });
    }
    return toConfiguredScene(document);
  }

  async deleteScene(sceneId: string): Promise<void> {
    await requireSceneDocument(this.gameProvider, sceneId).delete();
  }

  async cloneScene(sourceId: string, overrides: SceneCloneOverrides): Promise<Scene | null> {
    const source = requireSceneDocument(this.gameProvider, sourceId);
    const copy = await source.clone(toFoundryCloneData(overrides), { save: true });
    return copy ? toScene(copy) : null;
  }

  async activateScene(sceneId: string): Promise<void> {
    await requireSceneDocument(this.gameProvider, sceneId).activate();
  }

  async viewScene(sceneId: string, levelId?: string): Promise<void> {
    const document = requireSceneDocument(this.gameProvider, sceneId);
    await (levelId === undefined ? document.view() : document.view({ level: levelId }));
  }
}
