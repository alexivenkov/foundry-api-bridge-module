import type { UpdateMacroParams, UpdateMacroResult } from '@/commands/types';
import {
  createFoundryMacroService,
  toUpdateMacroCommand,
  updateMacroRequestSchema,
  type MacroWiring
} from '@/core/macros';
import { parseRequest } from '@/core/shared';
import { toWireMacroDetail } from './macroWireMappers';

export function createUpdateMacroHandler(
  wiring: MacroWiring = {}
): (params: UpdateMacroParams) => Promise<UpdateMacroResult> {
  const service = createFoundryMacroService(wiring);

  return async function updateMacroHandler(params: UpdateMacroParams): Promise<UpdateMacroResult> {
    const command = toUpdateMacroCommand(parseRequest(updateMacroRequestSchema, params));
    return toWireMacroDetail(await service.updateMacro(command));
  };
}

export const updateMacroHandler = createUpdateMacroHandler();
