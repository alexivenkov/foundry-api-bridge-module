export interface SceneIdentity {
  readonly id: string;
  readonly name: string;
}

// Synchronous by design: the scene collection lives in memory.
export interface SceneLocator {
  findScene(sceneId: string): SceneIdentity | null;
  findActiveScene(): SceneIdentity | null;
}
