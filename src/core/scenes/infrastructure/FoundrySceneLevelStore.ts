import { isV14Plus } from '@/compat/foundryVersion';
import {
  LevelNotFoundError,
  type LevelChanges,
  type LevelDraft,
  type SceneLevel,
  type SceneLevelStore,
  type SceneLevels
} from '@/core/scenes/domain';
import type { FoundryLevelDocument } from './foundrySceneTypes';
import { toFoundryLevelData, toSceneLevel, toSceneLevels } from './levelMapper';
import { requireSceneDocument, type SceneGameProvider } from './sceneDocuments';

/**
 * Anti-corruption layer over the Level documents of a scene (Foundry 14).
 * Levels are written as embedded documents, not through the scene's
 * `levels` array: an invalid embedded change sent with the scene is dropped
 * silently, while the level's own update validates it.
 */
export class FoundrySceneLevelStore implements SceneLevelStore {
  constructor(private readonly gameProvider: SceneGameProvider) {}

  levelsAvailable(): boolean {
    return isV14Plus();
  }

  readLevels(sceneId: string): SceneLevels {
    return toSceneLevels(requireSceneDocument(this.gameProvider, sceneId));
  }

  async createLevel(sceneId: string, draft: LevelDraft): Promise<SceneLevel | null> {
    const scene = requireSceneDocument(this.gameProvider, sceneId);
    const created = await scene.createEmbeddedDocuments?.('Level', [toFoundryLevelData(draft)]);
    const level = created?.[0];
    return level ? toSceneLevel(level) : null;
  }

  async updateLevel(sceneId: string, levelId: string, changes: LevelChanges): Promise<SceneLevel> {
    const level = this.requireLevelDocument(sceneId, levelId);
    await level.update(toFoundryLevelData(changes));
    return toSceneLevel(this.requireLevelDocument(sceneId, levelId));
  }

  async deleteLevel(sceneId: string, levelId: string): Promise<void> {
    await this.requireLevelDocument(sceneId, levelId).delete();
  }

  private requireLevelDocument(sceneId: string, levelId: string): FoundryLevelDocument {
    const level = requireSceneDocument(this.gameProvider, sceneId).levels?.get(levelId);
    if (level === undefined) {
      throw new LevelNotFoundError(levelId);
    }
    return level;
  }
}
