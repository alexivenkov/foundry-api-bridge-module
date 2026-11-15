import type { ClearHotbarSlotParams, ClearHotbarSlotResult } from '@/commands/types';
import { clearHotbarSlotRequestSchema, createFoundryHotbarService, toClearHotbarSlotCommand } from '@/core/macros';
import { parseRequest } from '@/core/shared';
import type { HotbarHandlerDependencies } from './GetHotbarHandler';
import { toWireHotbar } from './hotbarWireMappers';

export function createClearHotbarSlotHandler(
  deps: HotbarHandlerDependencies = {}
): (params: ClearHotbarSlotParams) => Promise<ClearHotbarSlotResult> {
  const service = createFoundryHotbarService(deps);

  return async function clearHotbarSlotHandler(params: ClearHotbarSlotParams): Promise<ClearHotbarSlotResult> {
    const command = toClearHotbarSlotCommand(parseRequest(clearHotbarSlotRequestSchema, params));
    const result = await service.clearSlot(command);
    return { ...toWireHotbar(result.hotbar), slot: result.slot, clearedMacroId: result.clearedMacroId };
  };
}

export const clearHotbarSlotHandler = createClearHotbarSlotHandler();
