import type { MoveHotbarSlotParams, MoveHotbarSlotResult } from '@/commands/types';
import { createFoundryHotbarService, moveHotbarSlotRequestSchema, toMoveHotbarSlotCommand } from '@/core/macros';
import { parseRequest } from '@/core/shared';
import type { HotbarHandlerDependencies } from './GetHotbarHandler';
import { toWireHotbar } from './hotbarWireMappers';

export function createMoveHotbarSlotHandler(
  deps: HotbarHandlerDependencies = {}
): (params: MoveHotbarSlotParams) => Promise<MoveHotbarSlotResult> {
  const service = createFoundryHotbarService(deps);

  return async function moveHotbarSlotHandler(params: MoveHotbarSlotParams): Promise<MoveHotbarSlotResult> {
    const command = toMoveHotbarSlotCommand(parseRequest(moveHotbarSlotRequestSchema, params));
    const result = await service.moveSlot(command);
    return {
      ...toWireHotbar(result.hotbar),
      fromSlot: result.fromSlot,
      toSlot: result.toSlot,
      macroId: result.macroId,
      swappedMacroId: result.swappedMacroId
    };
  };
}

export const moveHotbarSlotHandler = createMoveHotbarSlotHandler();
