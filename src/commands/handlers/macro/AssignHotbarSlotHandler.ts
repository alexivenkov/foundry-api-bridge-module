import type { AssignHotbarSlotParams, AssignHotbarSlotResult } from '@/commands/types';
import { assignHotbarSlotRequestSchema, createFoundryHotbarService, toAssignHotbarSlotCommand } from '@/core/macros';
import { parseRequest } from '@/core/shared';
import type { HotbarHandlerDependencies } from './GetHotbarHandler';
import { toWireHotbar } from './hotbarWireMappers';

export function createAssignHotbarSlotHandler(
  deps: HotbarHandlerDependencies = {}
): (params: AssignHotbarSlotParams) => Promise<AssignHotbarSlotResult> {
  const service = createFoundryHotbarService(deps);

  return async function assignHotbarSlotHandler(params: AssignHotbarSlotParams): Promise<AssignHotbarSlotResult> {
    const command = toAssignHotbarSlotCommand(parseRequest(assignHotbarSlotRequestSchema, params));
    const result = await service.assignSlot(command);
    return { ...toWireHotbar(result.hotbar), slot: result.slot, replacedMacroId: result.replacedMacroId };
  };
}

export const assignHotbarSlotHandler = createAssignHotbarSlotHandler();
