import type { SceneContents, SceneListing, SceneReader } from '@/core/scenes/domain';
import { toSceneContents } from './sceneContentsMapper';
import { requireSceneDocument, type SceneGameProvider } from './sceneDocuments';
import { toSceneListing } from './sceneMapper';

/**
 * Read-only view of the scenes and of what is placed on them. It reads the
 * embedded walls, notes and tokens itself, raw, instead of going through their
 * contexts: `get-scene` reports numeric codes those snapshots do not carry.
 */
export class FoundrySceneReader implements SceneReader {
  constructor(private readonly gameProvider: SceneGameProvider) {}

  listScenes(): readonly SceneListing[] {
    const listings: SceneListing[] = [];
    this.gameProvider.getGame().scenes.forEach((document) => {
      listings.push(toSceneListing(document));
    });
    return listings;
  }

  readScene(sceneId: string): SceneContents {
    return toSceneContents(requireSceneDocument(this.gameProvider, sceneId));
  }
}
