import { requireScene, type SceneLocator } from '@/core/shared';
import {
  RegionBehaviorCreationFailedError,
  RegionBehaviorNotFoundError,
  assertBehaviorConfigSupported,
  assertBehaviorTypeRegistered,
  assertMacroTargetAllowed,
  assertScriptBehaviorAllowed,
  macroTargetToCheck,
  type BehaviorConfigReader,
  type Region,
  type RegionBehavior,
  type RegionBehaviorCatalog,
  type RegionBehaviorConfigInput,
  type RegionBehaviorStore,
  type RegionMacroResolver,
  type RegionStore,
  type ScriptBehaviorPolicy
} from '@/core/regions/domain';
import type {
  CreateRegionBehaviorCommand,
  DeleteRegionBehaviorCommand,
  UpdateRegionBehaviorCommand
} from './commands';
import { requireRegion, requireRegionFeatures } from './regionLookup';
import type { RegionBehaviorDeletionResult, RegionBehaviorResult } from './results';

export interface RegionBehaviorServiceDependencies {
  readonly scenes: SceneLocator;
  readonly regions: RegionStore;
  readonly behaviors: RegionBehaviorStore;
  readonly catalog: RegionBehaviorCatalog;
  readonly scripts: ScriptBehaviorPolicy;
  readonly configs: BehaviorConfigReader;
  readonly macros: RegionMacroResolver;
}

export class RegionBehaviorService {
  constructor(private readonly deps: RegionBehaviorServiceDependencies) {}

  async createBehavior(command: CreateRegionBehaviorCommand): Promise<RegionBehaviorResult> {
    const { sceneId, region } = this.requireRegion(command.sceneId, command.regionId);
    assertBehaviorTypeRegistered(command.type, this.deps.catalog);
    assertScriptBehaviorAllowed(command.type, this.deps.scripts);
    const config = this.readConfig(command.type, command.config ?? {});
    await this.checkMacroTarget(macroTargetToCheck(undefined, command.type, config));

    const behavior = await this.deps.behaviors.createBehavior(sceneId, region.id, {
      type: command.type,
      name: command.name,
      disabled: command.disabled,
      config
    });
    if (behavior === null) {
      throw new RegionBehaviorCreationFailedError();
    }
    return { sceneId, regionId: region.id, behavior };
  }

  /** Both ends of a change are guarded: a script behavior may not be touched, and nothing may become one. */
  async updateBehavior(command: UpdateRegionBehaviorCommand): Promise<RegionBehaviorResult> {
    const { sceneId, region } = this.requireRegion(command.sceneId, command.regionId);
    const current = this.requireBehavior(region, command.behaviorId);
    const newType = command.type !== undefined && command.type !== current.type ? command.type : undefined;
    if (newType !== undefined) {
      assertBehaviorTypeRegistered(newType, this.deps.catalog);
    }
    assertScriptBehaviorAllowed(current.type, this.deps.scripts);
    assertScriptBehaviorAllowed(newType, this.deps.scripts);

    let config: RegionBehaviorConfigInput | undefined;
    if (command.config !== undefined || newType !== undefined) {
      config = this.readConfig(newType ?? current.type, command.config ?? {});
    }
    await this.checkMacroTarget(macroTargetToCheck(current, newType ?? current.type, config));

    const behavior = await this.deps.behaviors.updateBehavior(sceneId, region.id, current.id, {
      type: newType,
      name: command.name,
      disabled: command.disabled,
      config
    });
    if (behavior === null) {
      throw new RegionBehaviorNotFoundError(command.behaviorId);
    }
    return { sceneId, regionId: region.id, behavior };
  }

  /** Deleting is not guarded: removing a script behavior runs nothing. */
  async deleteBehavior(command: DeleteRegionBehaviorCommand): Promise<RegionBehaviorDeletionResult> {
    const { sceneId, region } = this.requireRegion(command.sceneId, command.regionId);
    const behavior = this.requireBehavior(region, command.behaviorId);
    await this.deps.behaviors.deleteBehavior(sceneId, region.id, behavior.id);
    return { sceneId, regionId: region.id, behaviorId: behavior.id };
  }

  private requireRegion(sceneId: string | undefined, regionId: string): { sceneId: string; region: Region } {
    requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, sceneId);
    return { sceneId: scene.id, region: requireRegion(this.deps.regions, scene.id, regionId) };
  }

  private requireBehavior(region: Region, behaviorId: string): RegionBehavior {
    const behavior = region.behaviors.find((candidate) => candidate.id === behaviorId);
    if (behavior === undefined) {
      throw new RegionBehaviorNotFoundError(behaviorId);
    }
    return behavior;
  }

  private async checkMacroTarget(macroUuid: string | null): Promise<void> {
    if (macroUuid !== null) {
      await assertMacroTargetAllowed(macroUuid, this.deps.macros, this.deps.scripts);
    }
  }

  private readConfig(type: string, raw: Readonly<Record<string, unknown>>): RegionBehaviorConfigInput {
    const config = this.deps.configs.read(type, raw);
    assertBehaviorConfigSupported(config, this.deps.catalog);
    return config;
  }
}
