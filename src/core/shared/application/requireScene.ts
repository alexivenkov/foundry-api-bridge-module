import {
  NoActiveSceneError,
  SceneNotFoundError,
  type SceneIdentity,
  type SceneLocator
} from '@/core/shared/domain';

/** The scene a command addresses: the one with `sceneId`, or the active scene when it is omitted. */
export function requireScene(scenes: SceneLocator, sceneId: string | undefined): SceneIdentity {
  if (sceneId === undefined) {
    const active = scenes.findActiveScene();
    if (active === null) {
      throw new NoActiveSceneError();
    }
    return active;
  }

  const scene = scenes.findScene(sceneId);
  if (scene === null) {
    throw new SceneNotFoundError(sceneId);
  }
  return scene;
}
