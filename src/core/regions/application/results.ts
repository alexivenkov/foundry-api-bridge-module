import type { ElevatedPoint, Region, RegionBehavior, RegionTokenRef } from '@/core/regions/domain';

export interface RegionListResult {
  readonly sceneId: string;
  readonly regions: readonly Region[];
}

export interface RegionResult {
  readonly sceneId: string;
  readonly region: Region;
}

export interface RegionDeletionResult {
  readonly sceneId: string;
  readonly regionId: string;
}

export interface RegionTokensResult {
  readonly sceneId: string;
  readonly regionId: string;
  readonly tokens: readonly RegionTokenRef[];
}

export interface RegionPointResult {
  readonly sceneId: string;
  readonly regionId: string;
  readonly point: ElevatedPoint;
  readonly inside: boolean;
}

export interface RegionBehaviorResult {
  readonly sceneId: string;
  readonly regionId: string;
  readonly behavior: RegionBehavior;
}

export interface RegionBehaviorDeletionResult {
  readonly sceneId: string;
  readonly regionId: string;
  readonly behaviorId: string;
}
