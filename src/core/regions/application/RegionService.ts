import { requireScene, type SceneLocator } from '@/core/shared';
import {
  RegionCreationFailedError,
  RegionLevelNotFoundError,
  RegionNotFoundError,
  RegionPointTestUnavailableError,
  RegionShapeNotComputedError,
  RegionTokenNotFoundError,
  assertElevationOrder,
  assertRegionChangesSupported,
  mergeElevation,
  type RegionChanges,
  type RegionStore
} from '@/core/regions/domain';
import type {
  CreateRegionCommand,
  DeleteRegionCommand,
  GetRegionQuery,
  ListRegionTokensQuery,
  ListRegionsQuery,
  TestRegionPointQuery,
  UpdateRegionCommand
} from './commands';
import { requireRegion, requireRegionFeatures } from './regionLookup';
import type {
  RegionDeletionResult,
  RegionListResult,
  RegionPointResult,
  RegionResult,
  RegionTokensResult
} from './results';

export interface RegionServiceDependencies {
  readonly scenes: SceneLocator;
  readonly regions: RegionStore;
}

export class RegionService {
  constructor(private readonly deps: RegionServiceDependencies) {}

  listRegions(query: ListRegionsQuery): RegionListResult {
    requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, regions: this.deps.regions.listRegions(scene.id) };
  }

  getRegion(query: GetRegionQuery): RegionResult {
    requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, region: requireRegion(this.deps.regions, scene.id, query.regionId) };
  }

  async createRegion(command: CreateRegionCommand): Promise<RegionResult> {
    const features = requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    assertRegionChangesSupported(features, command.draft);
    if (command.draft.elevation !== undefined) {
      assertElevationOrder(command.draft.elevation);
    }
    this.requireReferences(scene.id, command.draft);

    const region = await this.deps.regions.createRegion(scene.id, command.draft);
    if (region === null) {
      throw new RegionCreationFailedError();
    }
    return { sceneId: scene.id, region };
  }

  async updateRegion(command: UpdateRegionCommand): Promise<RegionResult> {
    const features = requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = requireRegion(this.deps.regions, scene.id, command.regionId);
    assertRegionChangesSupported(features, command.changes);
    if (command.changes.elevation !== undefined) {
      assertElevationOrder(mergeElevation(current.elevation, command.changes.elevation));
    }
    this.requireReferences(scene.id, command.changes);

    const region = await this.deps.regions.updateRegion(scene.id, current.id, command.changes);
    if (region === null) {
      throw new RegionNotFoundError(command.regionId);
    }
    return { sceneId: scene.id, region };
  }

  async deleteRegion(command: DeleteRegionCommand): Promise<RegionDeletionResult> {
    requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const region = requireRegion(this.deps.regions, scene.id, command.regionId);
    await this.deps.regions.deleteRegion(scene.id, region.id);
    return { sceneId: scene.id, regionId: region.id };
  }

  listTokensInside(query: ListRegionTokensQuery): RegionTokensResult {
    requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, query.sceneId);
    const region = requireRegion(this.deps.regions, scene.id, query.regionId);
    return { sceneId: scene.id, regionId: region.id, tokens: this.deps.regions.listTokensInside(scene.id, region.id) };
  }

  testPoint(query: TestRegionPointQuery): RegionPointResult {
    requireRegionFeatures(this.deps.regions);
    const scene = requireScene(this.deps.scenes, query.sceneId);
    const region = requireRegion(this.deps.regions, scene.id, query.regionId);
    const outcome = this.deps.regions.testPoint(scene.id, region.id, query.point);
    switch (outcome.kind) {
      case 'shape-not-computed':
        throw new RegionShapeNotComputedError(region.id);
      case 'unavailable':
        throw new RegionPointTestUnavailableError();
      case 'answered':
        return { sceneId: scene.id, regionId: region.id, point: query.point, inside: outcome.inside };
    }
  }

  private requireReferences(sceneId: string, changes: RegionChanges): void {
    const tokenId = changes.attachedTokenId;
    if (typeof tokenId === 'string' && !this.deps.regions.hasToken(sceneId, tokenId)) {
      throw new RegionTokenNotFoundError(tokenId);
    }
    if (changes.levelIds !== undefined) {
      const missing = this.deps.regions.findMissingLevels(sceneId, changes.levelIds)[0];
      if (missing !== undefined) {
        throw new RegionLevelNotFoundError(missing);
      }
    }
  }
}
