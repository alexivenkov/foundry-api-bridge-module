import { requireScene, type SceneIdentity, type SceneLocator } from '@/core/shared';
import {
  SceneThumbnailUnavailableError,
  UserNotFoundError,
  assertLevelsAvailable,
  requireLevel,
  type PulledUsers,
  type SceneLevelStore,
  type SceneNavigator,
  type SceneThumbnail,
  type SceneThumbnails,
  type TableBroadcast,
  type TableUser,
  type TableUsers
} from '@/core/scenes/domain';
import type { PreloadSceneCommand, PullUsersCommand, SceneTargetCommand, ViewSceneCommand } from './commands';

export interface SceneTableServiceDependencies {
  readonly scenes: SceneLocator;
  readonly navigator: SceneNavigator;
  readonly broadcast: TableBroadcast;
  readonly users: TableUsers;
  readonly levels: SceneLevelStore;
  readonly thumbnails: SceneThumbnails;
}

export interface ViewedScene extends SceneIdentity {
  readonly levelId?: string | undefined;
}

export interface PreloadedScene {
  readonly sceneId: string;
  readonly levelId?: string | undefined;
}

/** What every connected client sees and loads, and what the GM resets for them. */
export class SceneTableService {
  constructor(private readonly deps: SceneTableServiceDependencies) {}

  async viewScene(command: ViewSceneCommand): Promise<ViewedScene> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (command.levelId === undefined) {
      await this.deps.navigator.viewScene(scene.id);
      return scene;
    }
    this.requireLevelOf(scene.id, command.levelId);
    await this.deps.navigator.viewScene(scene.id, command.levelId);
    return { ...scene, levelId: command.levelId };
  }

  /** The core only reaches connected users; listed users who are offline are reported, not refused. */
  pullUsers(command: PullUsersCommand): PulledUsers {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (command.levelId !== undefined) {
      this.requireLevelOf(scene.id, command.levelId);
    }
    const targets = this.targetUsers(command.userIds);
    const pulledUserIds = targets.filter((user) => user.active).map((user) => user.id);
    const offlineUserIds = targets.filter((user) => !user.active).map((user) => user.id);
    if (pulledUserIds.length > 0) {
      this.deps.broadcast.pullUsers(scene.id, pulledUserIds, command.levelId);
    }
    return {
      sceneId: scene.id,
      pulledUserIds,
      offlineUserIds,
      ...(command.levelId !== undefined ? { levelId: command.levelId } : {})
    };
  }

  async preloadScene(command: PreloadSceneCommand): Promise<PreloadedScene> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (command.levelId === undefined) {
      await this.deps.broadcast.preloadScene(scene.id);
      return { sceneId: scene.id };
    }
    this.requireLevelOf(scene.id, command.levelId);
    await this.deps.broadcast.preloadScene(scene.id, command.levelId);
    return { sceneId: scene.id, levelId: command.levelId };
  }

  /** Works for any scene: the server deletes the stored exploration, whatever the GM is viewing. */
  resetFog(command: SceneTargetCommand): SceneIdentity {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.deps.broadcast.resetFog(scene.id);
    return scene;
  }

  async regenerateThumbnail(command: SceneTargetCommand): Promise<SceneThumbnail> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const blocker = this.deps.thumbnails.thumbnailBlocker(scene.id);
    if (blocker !== null) {
      throw new SceneThumbnailUnavailableError(blocker, scene.id);
    }
    return { sceneId: scene.id, thumb: await this.deps.thumbnails.regenerateThumbnail(scene.id) };
  }

  private targetUsers(userIds: readonly string[] | undefined): readonly TableUser[] {
    const users = this.deps.users.listUsers();
    if (userIds === undefined) {
      const self = this.deps.users.currentUserId();
      return users.filter((user) => user.id !== self);
    }
    return [...new Set(userIds)].map((userId) => {
      const user = users.find((candidate) => candidate.id === userId);
      if (user === undefined) {
        throw new UserNotFoundError(userId);
      }
      return user;
    });
  }

  private requireLevelOf(sceneId: string, levelId: string): void {
    assertLevelsAvailable(this.deps.levels.levelsAvailable());
    requireLevel(this.deps.levels.readLevels(sceneId), levelId);
  }
}
