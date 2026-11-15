import type {
  AssignHotbarSlotCommand,
  ClearHotbarSlotCommand,
  GetHotbarQuery,
  MoveHotbarSlotCommand
} from '@/core/macros/application';
import { emptyAsAbsent } from '@/core/shared';
import type {
  AssignHotbarSlotRequest,
  ClearHotbarSlotRequest,
  GetHotbarRequest,
  MoveHotbarSlotRequest
} from './hotbarSchemas';

export function toGetHotbarQuery(request: GetHotbarRequest): GetHotbarQuery {
  return { userId: emptyAsAbsent(request.userId), page: request.page };
}

export function toAssignHotbarSlotCommand(request: AssignHotbarSlotRequest): AssignHotbarSlotCommand {
  return { userId: emptyAsAbsent(request.userId), macroId: request.macroId, slot: request.slot };
}

export function toMoveHotbarSlotCommand(request: MoveHotbarSlotRequest): MoveHotbarSlotCommand {
  return { userId: emptyAsAbsent(request.userId), fromSlot: request.fromSlot, toSlot: request.toSlot };
}

export function toClearHotbarSlotCommand(request: ClearHotbarSlotRequest): ClearHotbarSlotCommand {
  return { userId: emptyAsAbsent(request.userId), slot: request.slot };
}
