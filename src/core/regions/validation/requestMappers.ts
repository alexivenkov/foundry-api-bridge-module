import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateRegionBehaviorCommand,
  CreateRegionCommand,
  DeleteRegionBehaviorCommand,
  DeleteRegionCommand,
  GetRegionQuery,
  ListRegionTokensQuery,
  ListRegionsQuery,
  TestRegionPointQuery,
  UpdateRegionBehaviorCommand,
  UpdateRegionCommand
} from '@/core/regions/application';
import type { RegionChanges } from '@/core/regions/domain';
import type {
  CreateRegionBehaviorRequest,
  CreateRegionRequest,
  DeleteRegionBehaviorRequest,
  DeleteRegionRequest,
  GetRegionRequest,
  GetRegionTokensRequest,
  GetRegionsRequest,
  TestRegionPointRequest,
  UpdateRegionBehaviorRequest,
  UpdateRegionRequest
} from './regionSchemas';

type RegionAttributesRequest = Omit<UpdateRegionRequest, 'sceneId' | 'regionId'>;

function toRegionChanges(request: RegionAttributesRequest): RegionChanges {
  return {
    name: request.name,
    color: request.color,
    shapes: request.shapes,
    elevation: request.elevation,
    visibility: request.visibility,
    locked: request.locked,
    levelIds: request.levelIds,
    restriction: request.restriction,
    attachedTokenId: request.attachedTokenId,
    highlightMode: request.highlightMode,
    displayMeasurements: request.displayMeasurements,
    hidden: request.hidden
  };
}

export function toListRegionsQuery(request: GetRegionsRequest): ListRegionsQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toGetRegionQuery(request: GetRegionRequest): GetRegionQuery {
  return { sceneId: emptyAsAbsent(request.sceneId), regionId: request.regionId };
}

export function toCreateRegionCommand(request: CreateRegionRequest): CreateRegionCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), draft: { ...toRegionChanges(request), name: request.name } };
}

export function toUpdateRegionCommand(request: UpdateRegionRequest): UpdateRegionCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    regionId: request.regionId,
    changes: toRegionChanges(request)
  };
}

export function toDeleteRegionCommand(request: DeleteRegionRequest): DeleteRegionCommand {
  return toGetRegionQuery(request);
}

export function toListRegionTokensQuery(request: GetRegionTokensRequest): ListRegionTokensQuery {
  return toGetRegionQuery(request);
}

export function toTestRegionPointQuery(request: TestRegionPointRequest): TestRegionPointQuery {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    regionId: request.regionId,
    point: { x: request.x, y: request.y, elevation: request.elevation ?? 0 }
  };
}

export function toCreateRegionBehaviorCommand(request: CreateRegionBehaviorRequest): CreateRegionBehaviorCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    regionId: request.regionId,
    type: request.type,
    name: request.name,
    disabled: request.disabled,
    config: request.config
  };
}

export function toUpdateRegionBehaviorCommand(request: UpdateRegionBehaviorRequest): UpdateRegionBehaviorCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    regionId: request.regionId,
    behaviorId: request.behaviorId,
    type: request.type,
    name: request.name,
    disabled: request.disabled,
    config: request.config
  };
}

export function toDeleteRegionBehaviorCommand(request: DeleteRegionBehaviorRequest): DeleteRegionBehaviorCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), regionId: request.regionId, behaviorId: request.behaviorId };
}
