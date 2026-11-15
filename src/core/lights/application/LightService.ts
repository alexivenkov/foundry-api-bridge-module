import { requireScene, type SceneLocator } from '@/core/shared';
import {
  DEFAULT_DARKNESS_RANGE,
  LightCreationFailedError,
  LightNotFoundError,
  assertKnownAnimation,
  assertLightFeatures,
  assertSceneLevels,
  resolveDarknessRange,
  type Light,
  type LightChanges,
  type LightDarknessRange,
  type LightEnvironment,
  type LightStore
} from '@/core/lights/domain';
import type {
  CreateLightCommand,
  DeleteLightCommand,
  LightDeletionResult,
  LightListResult,
  LightMutationResult,
  ListLightsQuery,
  UpdateLightCommand
} from './commands';

export interface LightServiceDependencies {
  readonly scenes: SceneLocator;
  readonly lights: LightStore;
  readonly environment: LightEnvironment;
}

interface LightState {
  readonly negative: boolean;
  readonly darkness: LightDarknessRange;
}

const NEW_LIGHT: LightState = { negative: false, darkness: DEFAULT_DARKNESS_RANGE };

export class LightService {
  constructor(private readonly deps: LightServiceDependencies) {}

  listLights(query: ListLightsQuery): LightListResult {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, lights: this.deps.lights.listLights(scene.id) };
  }

  async createLight(command: CreateLightCommand): Promise<LightMutationResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.checkChanges(scene.id, command.draft, NEW_LIGHT);
    const light = await this.deps.lights.createLight(scene.id, command.draft);
    if (light === null) {
      throw new LightCreationFailedError();
    }
    return { sceneId: scene.id, light };
  }

  async updateLight(command: UpdateLightCommand): Promise<LightMutationResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = this.requireLight(scene.id, command.lightId);
    this.checkChanges(scene.id, command.changes, {
      negative: current.negative ?? false,
      darkness: current.darkness
    });
    const light = await this.deps.lights.updateLight(scene.id, command.lightId, command.changes);
    if (light === null) {
      throw new LightNotFoundError(command.lightId);
    }
    return { sceneId: scene.id, light };
  }

  async deleteLight(command: DeleteLightCommand): Promise<LightDeletionResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireLight(scene.id, command.lightId);
    await this.deps.lights.deleteLight(scene.id, command.lightId);
    return { sceneId: scene.id, lightId: command.lightId };
  }

  private requireLight(sceneId: string, lightId: string): Light {
    const light = this.deps.lights.findLight(sceneId, lightId);
    if (light === null) {
      throw new LightNotFoundError(lightId);
    }
    return light;
  }

  private checkChanges(sceneId: string, changes: LightChanges, current: LightState): void {
    assertLightFeatures(changes, this.deps.environment.features());
    resolveDarknessRange(current.darkness, changes.darkness);
    const kind = (changes.negative ?? current.negative) ? 'darkness' : 'light';
    assertKnownAnimation(changes.animation?.type, kind, this.deps.environment.animationTypes(kind));
    if (changes.levels !== undefined) {
      assertSceneLevels(changes.levels, this.deps.lights.listSceneLevelIds(sceneId));
    }
  }
}
