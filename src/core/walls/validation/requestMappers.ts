import type {
  CreateWallCommand,
  DeleteWallCommand,
  ListWallsQuery,
  SetDoorStateCommand,
  UpdateWallCommand
} from '@/core/walls/application';
import { emptyAsAbsent } from '@/core/shared';
import { parseWallMovement, type WallChanges } from '@/core/walls/domain';
import { doorStateFromWireCode } from './doorWireCodes';
import type {
  CreateWallRequest,
  DeleteWallRequest,
  GetWallsRequest,
  SetDoorStateRequest,
  UpdateWallRequest
} from './wallSchemas';

type WallAttributesRequest = Pick<
  CreateWallRequest,
  'door' | 'doorState' | 'move' | 'sense' | 'sound' | 'light' | 'dir' | 'threshold' | 'doorSound' | 'animation'
>;

/** The core form submits "no sound" as an empty string. */
function emptyAsNull(value: string | null | undefined): string | null | undefined {
  return value === '' ? null : value;
}

function toWallChanges(request: WallAttributesRequest): WallChanges {
  return {
    door: request.door,
    doorState: request.doorState,
    movement: request.move !== undefined ? parseWallMovement(request.move) : undefined,
    sight: request.sense,
    sound: request.sound,
    light: request.light,
    direction: request.dir,
    threshold: request.threshold,
    doorSound: emptyAsNull(request.doorSound),
    animation: request.animation
  };
}

export function toListWallsQuery(request: GetWallsRequest): ListWallsQuery {
  return { sceneId: request.sceneId };
}

export function toCreateWallCommand(request: CreateWallRequest): CreateWallCommand {
  return {
    sceneId: request.sceneId,
    draft: { ...toWallChanges(request), segment: request.c }
  };
}

export function toUpdateWallCommand(request: UpdateWallRequest): UpdateWallCommand {
  return {
    sceneId: request.sceneId,
    wallId: request.wallId,
    changes: { ...toWallChanges(request), segment: request.c }
  };
}

export function toDeleteWallCommand(request: DeleteWallRequest): DeleteWallCommand {
  return { sceneId: request.sceneId, wallId: request.wallId };
}

export function toSetDoorStateCommand(request: SetDoorStateRequest): SetDoorStateCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    wallId: request.wallId,
    state: doorStateFromWireCode(request.state)
  };
}
