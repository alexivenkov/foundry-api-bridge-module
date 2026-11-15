import { requireScene, type SceneLocator } from '@/core/shared';
import {
  LevelCreationFailedError,
  OnlyLevelDeletionError,
  assertLevelsAvailable,
  assertVisibleLevels,
  newLevelElevation,
  requireLevel,
  resolveElevation,
  type SceneLevel,
  type SceneLevelStore,
  type SceneLevels
} from '@/core/scenes/domain';
import type {
  CreateLevelCommand,
  DeleteLevelCommand,
  SceneTargetCommand,
  UpdateLevelCommand
} from './commands';

export interface SceneLevelServiceDependencies {
  readonly scenes: SceneLocator;
  readonly levels: SceneLevelStore;
}

export interface LevelOfScene {
  readonly sceneId: string;
  readonly level: SceneLevel;
  /** The scene's initial level after the write. */
  readonly initialLevelId: string | null;
}

export interface DeletedLevel {
  readonly sceneId: string;
  readonly levelId: string;
}

/** The levels of a scene (Foundry 14+), refused on older cores. */
export class SceneLevelService {
  constructor(private readonly deps: SceneLevelServiceDependencies) {}

  listLevels(query: SceneTargetCommand): SceneLevels {
    return this.levelsOf(query.sceneId);
  }

  async createLevel(command: CreateLevelCommand): Promise<LevelOfScene> {
    const levels = this.levelsOf(command.sceneId);
    resolveElevation(newLevelElevation(levels), command.draft.elevation);
    assertVisibleLevels(levels, command.draft.visibleLevelIds, null);

    const level = await this.deps.levels.createLevel(levels.sceneId, command.draft);
    if (level === null) {
      throw new LevelCreationFailedError();
    }
    return this.levelOfScene(levels.sceneId, level);
  }

  async updateLevel(command: UpdateLevelCommand): Promise<LevelOfScene> {
    const levels = this.levelsOf(command.sceneId);
    const current = requireLevel(levels, command.levelId);
    resolveElevation(current.elevation, command.changes.elevation);
    assertVisibleLevels(levels, command.changes.visibleLevelIds, current.id);

    const level = await this.deps.levels.updateLevel(levels.sceneId, current.id, command.changes);
    return this.levelOfScene(levels.sceneId, level);
  }

  /** The server refuses to leave a scene without levels; that is refused here first, with a plain text. */
  async deleteLevel(command: DeleteLevelCommand): Promise<DeletedLevel> {
    const levels = this.levelsOf(command.sceneId);
    const level = requireLevel(levels, command.levelId);
    if (levels.levels.length <= 1) {
      throw new OnlyLevelDeletionError(levels.sceneId);
    }
    await this.deps.levels.deleteLevel(levels.sceneId, level.id);
    return { sceneId: levels.sceneId, levelId: level.id };
  }

  private levelOfScene(sceneId: string, level: SceneLevel): LevelOfScene {
    return { sceneId, level, initialLevelId: this.deps.levels.readLevels(sceneId).initialLevelId };
  }

  private levelsOf(sceneId: string | undefined): SceneLevels {
    assertLevelsAvailable(this.deps.levels.levelsAvailable());
    return this.deps.levels.readLevels(requireScene(this.deps.scenes, sceneId).id);
  }
}
