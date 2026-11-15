import type { DeleteMacroParams, DeleteMacroResult } from '@/commands/types';
import {
  createFoundryMacroService,
  deleteMacroRequestSchema,
  toDeleteMacroCommand,
  type MacroWiring
} from '@/core/macros';
import { parseRequest } from '@/core/shared';

export function createDeleteMacroHandler(
  wiring: MacroWiring = {}
): (params: DeleteMacroParams) => Promise<DeleteMacroResult> {
  const service = createFoundryMacroService(wiring);

  return async function deleteMacroHandler(params: DeleteMacroParams): Promise<DeleteMacroResult> {
    const command = toDeleteMacroCommand(parseRequest(deleteMacroRequestSchema, params));
    await service.deleteMacro(command);
    return { deleted: true, macroId: command.macroId };
  };
}

export const deleteMacroHandler = createDeleteMacroHandler();
