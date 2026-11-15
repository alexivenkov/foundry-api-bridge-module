import { requireScene, type SceneIdentity, type SceneLocator } from '@/core/shared';
import { SceneCloneCancelledError, type Scene, type SceneNavigator, type SceneStore } from '@/core/scenes/domain';
import type { ActivateSceneCommand, CloneSceneCommand, DeleteSceneCommand } from './commands';

export interface SceneServiceDependencies {
  readonly scenes: SceneLocator;
  readonly store: SceneStore;
  readonly navigator: SceneNavigator;
}

/**
 * Deleting, copying and activating scenes. Creating and updating them, with
 * their settings, is `SceneSettingsService`; viewing them, `SceneTableService`.
 */
export class SceneService {
  constructor(private readonly deps: SceneServiceDependencies) {}

  async deleteScene(command: DeleteSceneCommand): Promise<SceneIdentity> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    await this.deps.store.deleteScene(scene.id);
    return scene;
  }

  async cloneScene(command: CloneSceneCommand): Promise<Scene> {
    const source = requireScene(this.deps.scenes, command.sourceId);
    const copy = await this.deps.store.cloneScene(source.id, command.overrides);
    if (copy === null) {
      throw new SceneCloneCancelledError();
    }
    return copy;
  }

  async activateScene(command: ActivateSceneCommand): Promise<SceneIdentity> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    await this.deps.navigator.activateScene(scene.id);
    return scene;
  }
}
