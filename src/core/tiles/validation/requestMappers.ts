import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateTileCommand,
  DeleteTileCommand,
  ListTilesQuery,
  UpdateTileCommand
} from '@/core/tiles/application';
import type { TileChanges } from '@/core/tiles/domain';
import type {
  CreateTileRequest,
  DeleteTileRequest,
  GetTilesRequest,
  UpdateTileRequest
} from './tileSchemas';

type TileAttributesRequest = Omit<UpdateTileRequest, 'sceneId' | 'tileId'>;

function unique<T>(values: readonly T[] | undefined): T[] | undefined {
  return values !== undefined ? [...new Set(values)] : undefined;
}

function toTileChanges(request: TileAttributesRequest): TileChanges {
  return {
    x: request.x,
    y: request.y,
    width: request.width,
    height: request.height,
    elevation: request.elevation,
    sort: request.sort,
    rotation: request.rotation,
    alpha: request.alpha,
    hidden: request.hidden,
    locked: request.locked,
    texture: request.texture,
    restrictions: request.restrictions,
    occlusion:
      request.occlusion !== undefined
        ? { modes: unique(request.occlusion.modes), alpha: request.occlusion.alpha }
        : undefined,
    video: request.video,
    name: request.name === '' ? null : request.name,
    levels: unique(request.levels)
  };
}

export function toListTilesQuery(request: GetTilesRequest): ListTilesQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toCreateTileCommand(request: CreateTileRequest): CreateTileCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    draft: {
      ...toTileChanges(request),
      x: request.x,
      y: request.y,
      width: request.width,
      height: request.height
    }
  };
}

export function toUpdateTileCommand(request: UpdateTileRequest): UpdateTileCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    tileId: request.tileId,
    changes: toTileChanges(request)
  };
}

export function toDeleteTileCommand(request: DeleteTileRequest): DeleteTileCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), tileId: request.tileId };
}
