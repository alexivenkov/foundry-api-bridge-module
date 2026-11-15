import type { CreateMacroParams, CreateMacroResult } from '@/commands/types';
import {
  createFoundryMacroService,
  createMacroRequestSchema,
  toCreateMacroCommand,
  type MacroWiring
} from '@/core/macros';
import { parseRequest } from '@/core/shared';
import { toWireMacroDetail } from './macroWireMappers';

export function createCreateMacroHandler(
  wiring: MacroWiring = {}
): (params: CreateMacroParams) => Promise<CreateMacroResult> {
  const service = createFoundryMacroService(wiring);

  return async function createMacroHandler(params: CreateMacroParams): Promise<CreateMacroResult> {
    const command = toCreateMacroCommand(parseRequest(createMacroRequestSchema, params));
    return toWireMacroDetail(await service.createMacro(command));
  };
}

export const createMacroHandler = createCreateMacroHandler();
