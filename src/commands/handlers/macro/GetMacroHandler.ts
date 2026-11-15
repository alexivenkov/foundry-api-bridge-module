import type { GetMacroParams, GetMacroResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryMacroService, getMacroRequestSchema, toGetMacroQuery, type MacroWiring } from '@/core/macros';
import { parseRequest } from '@/core/shared';
import { toWireMacroDetail } from './macroWireMappers';

export function createGetMacroHandler(
  wiring: MacroWiring = {}
): (params: GetMacroParams) => Promise<GetMacroResult> {
  const service = createFoundryMacroService(wiring);

  return function getMacroHandler(params: GetMacroParams): Promise<GetMacroResult> {
    try {
      const macro = service.getMacro(toGetMacroQuery(parseRequest(getMacroRequestSchema, params)));
      return Promise.resolve(toWireMacroDetail(macro));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getMacroHandler = createGetMacroHandler();
