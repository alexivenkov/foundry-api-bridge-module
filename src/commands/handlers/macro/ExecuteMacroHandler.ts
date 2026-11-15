import type { ExecuteMacroParams, ExecuteMacroResult } from '@/commands/types';
import {
  createFoundryMacroExecutionService,
  executeMacroRequestSchema,
  toExecuteMacroCommand,
  type MacroWiring
} from '@/core/macros';
import { parseRequest } from '@/core/shared';

export function createExecuteMacroHandler(
  wiring: MacroWiring = {}
): (params: ExecuteMacroParams) => Promise<ExecuteMacroResult> {
  const service = createFoundryMacroExecutionService(wiring);

  return async function executeMacroHandler(params: ExecuteMacroParams): Promise<ExecuteMacroResult> {
    const command = toExecuteMacroCommand(parseRequest(executeMacroRequestSchema, params));
    const { macro, result } = await service.executeMacro(command);
    return {
      executed: true,
      macroId: command.macroId,
      macroName: macro.name,
      macroType: macro.type,
      ...result
    };
  };
}

export const executeMacroHandler = createExecuteMacroHandler();
