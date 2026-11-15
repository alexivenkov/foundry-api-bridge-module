import { isV14Plus } from '@/compat/foundryVersion';
import type { SceneThumbnails, TableBroadcast, ThumbnailBlocker } from '@/core/scenes/domain';
import { requireSceneDocument, type SceneGameProvider } from './sceneDocuments';
import { hasPullUsers } from './sceneFeatures';
import { readBackgroundSrc } from './sceneMapper';

// Verified against the client and server code of Foundry 13.351 and 14.368:
// - `Scenes#preload(id, push)` (13) / `(id, { broadcast, level })` (14) emits
//   `preloadScene` to the other clients and loads the scene here as well.
// - `Scene#pullUsers(users[, viewOptions])` emits `pullToScene` per connected user.
// - The server's `resetFog` handler deletes every FogExploration of the given
//   scene and broadcasts `resetFog { sceneId }`; clients drawing that scene
//   reset their fog. `FogManager#reset` does nothing more than emit it for
//   the scene on the canvas, so any scene can be reset.
// - The scene directory's "Generate Thumbnail" entry: `createThumbnail()`,
//   then `update({ thumb }, { diff: false })`; the server stores the image.
export class FoundrySceneTable implements TableBroadcast, SceneThumbnails {
  constructor(private readonly gameProvider: SceneGameProvider) {}

  pullUsers(sceneId: string, userIds: readonly string[], levelId?: string): void {
    const scene = requireSceneDocument(this.gameProvider, sceneId);
    if (hasPullUsers() && scene.pullUsers) {
      if (levelId === undefined) {
        scene.pullUsers([...userIds]);
      } else {
        scene.pullUsers([...userIds], { level: levelId });
      }
      return;
    }
    const socket = this.gameProvider.getGame().socket;
    for (const userId of userIds) {
      socket?.emit('pullToScene', sceneId, userId);
    }
  }

  async preloadScene(sceneId: string, levelId?: string): Promise<void> {
    const scenes = this.gameProvider.getGame().scenes;
    if (!isV14Plus()) {
      await scenes.preload?.(sceneId, true);
      return;
    }
    await scenes.preload?.(sceneId, levelId === undefined ? { broadcast: true } : { broadcast: true, level: levelId });
  }

  resetFog(sceneId: string): void {
    this.gameProvider.getGame().socket?.emit('resetFog', sceneId);
  }

  /** The conditions under which the core's scene directory offers "Generate Thumbnail". */
  thumbnailBlocker(sceneId: string): ThumbnailBlocker | null {
    const game = this.gameProvider.getGame();
    const scene = requireSceneDocument(this.gameProvider, sceneId);
    if (game.settings?.get('core', 'noCanvas') === true) {
      return 'noCanvas';
    }
    if (isV14Plus()) {
      return scene.initialLevel?.background?.src ? null : 'nothingToDraw';
    }
    const hasTiles = (scene.tiles?.contents.length ?? 0) > 0;
    return readBackgroundSrc(scene) || hasTiles ? null : 'nothingToDraw';
  }

  async regenerateThumbnail(sceneId: string): Promise<string | null> {
    const scene = requireSceneDocument(this.gameProvider, sceneId);
    const created = await scene.createThumbnail?.();
    if (created?.thumb) {
      await scene.update({ thumb: created.thumb }, { diff: false });
    }
    return scene.thumb ?? null;
  }
}
