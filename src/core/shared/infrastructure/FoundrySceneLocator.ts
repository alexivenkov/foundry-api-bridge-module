import type { SceneIdentity, SceneLocator } from '@/core/shared/domain';
import { findFoundryScene, type FoundrySceneLike, type FoundryScenesGame } from './foundryScenes';
import type { GameProvider } from './gameProvider';

function toIdentity(scene: FoundrySceneLike): SceneIdentity {
  return { id: scene.id, name: scene.name ?? '' };
}

export class FoundrySceneLocator implements SceneLocator {
  constructor(private readonly gameProvider: GameProvider<FoundryScenesGame>) {}

  findScene(sceneId: string): SceneIdentity | null {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    return scene !== undefined ? toIdentity(scene) : null;
  }

  findActiveScene(): SceneIdentity | null {
    const scene = this.gameProvider.getGame().scenes.active;
    return scene ? toIdentity(scene) : null;
  }
}
