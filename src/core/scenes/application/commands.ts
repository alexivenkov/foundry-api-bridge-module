import type {
  LevelChanges,
  LevelDraft,
  SceneChanges,
  SceneCloneOverrides,
  SceneDraft,
  SceneUpdateOptions
} from '@/core/scenes/domain';

export interface DescribeSceneQuery {
  readonly sceneId: string | undefined;
  readonly includeScreenshot: boolean;
}

export interface CreateSceneCommand {
  readonly draft: SceneDraft;
}

export interface UpdateSceneCommand {
  readonly sceneId: string;
  readonly changes: SceneChanges;
  readonly options?: SceneUpdateOptions | undefined;
}

export interface DeleteSceneCommand {
  readonly sceneId: string;
}

export interface CloneSceneCommand {
  readonly sourceId: string;
  readonly overrides: SceneCloneOverrides;
}

export interface ActivateSceneCommand {
  readonly sceneId: string;
}

export interface ViewSceneCommand {
  readonly sceneId: string;
  /** Foundry 14+. */
  readonly levelId?: string | undefined;
}

/** A command that names a scene, or the active one when `sceneId` is undefined. */
export interface SceneTargetCommand {
  readonly sceneId: string | undefined;
}

export interface PullUsersCommand extends SceneTargetCommand {
  /** Undefined: every connected user except the one this module runs as. */
  readonly userIds: readonly string[] | undefined;
  readonly levelId: string | undefined;
}

export interface PreloadSceneCommand extends SceneTargetCommand {
  readonly levelId: string | undefined;
}

export interface CreateLevelCommand extends SceneTargetCommand {
  readonly draft: LevelDraft;
}

export interface UpdateLevelCommand extends SceneTargetCommand {
  readonly levelId: string;
  readonly changes: LevelChanges;
}

export interface DeleteLevelCommand extends SceneTargetCommand {
  readonly levelId: string;
}
