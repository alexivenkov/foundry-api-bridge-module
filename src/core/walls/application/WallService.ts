import { requireScene, type SceneLocator } from '@/core/shared';
import {
  NotADoorError,
  WallCreationFailedError,
  WallNotFoundError,
  assertKnownDoorAnimation,
  assertKnownDoorSound,
  assertWallFeatures,
  isDoor,
  resolveThresholdChanges,
  type DoorSoundOption,
  type Wall,
  type WallChanges,
  type WallEnvironment,
  type WallStore
} from '@/core/walls/domain';
import type {
  CreateWallCommand,
  DeleteWallCommand,
  ListWallsQuery,
  SetDoorStateCommand,
  UpdateWallCommand
} from './commands';
import type { DoorStateChangeResult, WallDeletionResult, WallListResult } from './results';

export interface WallServiceDependencies {
  readonly scenes: SceneLocator;
  readonly walls: WallStore;
  /** Feature and registry checks of the running world; without one every feature counts as present and ids go unchecked. */
  readonly environment?: WallEnvironment | undefined;
}

const UNCHECKED_ENVIRONMENT: WallEnvironment = {
  features: () => ({ doorAnimation: true }),
  doorSounds: () => null,
  doorAnimationTypes: () => null
};

export class WallService {
  constructor(private readonly deps: WallServiceDependencies) {}

  listWalls(query: ListWallsQuery): WallListResult {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, walls: this.deps.walls.listWalls(scene.id) };
  }

  async createWall(command: CreateWallCommand): Promise<Wall> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const draft = { ...this.checkChanges(null, command.draft), segment: command.draft.segment };
    const wall = await this.deps.walls.createWall(scene.id, draft);
    if (wall === null) {
      throw new WallCreationFailedError();
    }
    return wall;
  }

  async updateWall(command: UpdateWallCommand): Promise<Wall> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = this.requireWall(scene.id, command.wallId);
    return this.applyChanges(scene.id, command.wallId, this.checkChanges(current, command.changes));
  }

  /** The door sounds the running world registers. */
  listDoorSounds(): readonly DoorSoundOption[] {
    return this.environment().doorSounds() ?? [];
  }

  async deleteWall(command: DeleteWallCommand): Promise<WallDeletionResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireWall(scene.id, command.wallId);
    await this.deps.walls.deleteWall(scene.id, command.wallId);
    return { sceneId: scene.id, wallId: command.wallId };
  }

  async setDoorState(command: SetDoorStateCommand): Promise<DoorStateChangeResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const wall = this.requireWall(scene.id, command.wallId);
    if (!isDoor(wall)) {
      throw new NotADoorError(wall.id);
    }
    const updated = await this.applyChanges(scene.id, wall.id, { doorState: command.state });
    return { wall: updated, previousState: wall.doorState };
  }

  private environment(): WallEnvironment {
    return this.deps.environment ?? UNCHECKED_ENVIRONMENT;
  }

  private checkChanges(current: Wall | null, changes: WallChanges): WallChanges {
    const environment = this.environment();
    assertWallFeatures(changes, environment.features());
    assertKnownDoorSound(changes.doorSound, environment.doorSounds());
    assertKnownDoorAnimation(changes.animation?.type, environment.doorAnimationTypes());
    return resolveThresholdChanges(current, changes);
  }

  private requireWall(sceneId: string, wallId: string): Wall {
    const wall = this.deps.walls.findWall(sceneId, wallId);
    if (wall === null) {
      throw new WallNotFoundError(wallId);
    }
    return wall;
  }

  private async applyChanges(
    sceneId: string,
    wallId: string,
    changes: UpdateWallCommand['changes']
  ): Promise<Wall> {
    const updated = await this.deps.walls.updateWall(sceneId, wallId, changes);
    if (updated === null) {
      throw new WallNotFoundError(wallId);
    }
    return updated;
  }
}
