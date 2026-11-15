import type { ElevatedPoint, RegionChanges, RegionDraft } from '@/core/regions/domain';

export interface ListRegionsQuery {
  readonly sceneId: string | undefined;
}

export interface GetRegionQuery {
  readonly sceneId: string | undefined;
  readonly regionId: string;
}

export interface CreateRegionCommand {
  readonly sceneId: string | undefined;
  readonly draft: RegionDraft;
}

export interface UpdateRegionCommand {
  readonly sceneId: string | undefined;
  readonly regionId: string;
  readonly changes: RegionChanges;
}

export type DeleteRegionCommand = GetRegionQuery;

export type ListRegionTokensQuery = GetRegionQuery;

export interface TestRegionPointQuery {
  readonly sceneId: string | undefined;
  readonly regionId: string;
  readonly point: ElevatedPoint;
}

/** `config` is the caller's object, read against the behavior type by the service. */
export interface CreateRegionBehaviorCommand {
  readonly sceneId: string | undefined;
  readonly regionId: string;
  readonly type: string;
  readonly name?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly config?: Readonly<Record<string, unknown>> | undefined;
}

export interface UpdateRegionBehaviorCommand {
  readonly sceneId: string | undefined;
  readonly regionId: string;
  readonly behaviorId: string;
  readonly type?: string | undefined;
  readonly name?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly config?: Readonly<Record<string, unknown>> | undefined;
}

export interface DeleteRegionBehaviorCommand {
  readonly sceneId: string | undefined;
  readonly regionId: string;
  readonly behaviorId: string;
}
