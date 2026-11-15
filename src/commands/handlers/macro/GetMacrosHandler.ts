import type { GetMacrosParams, GetMacrosResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryMacroService, getMacrosRequestSchema, toListMacrosQuery, type MacroWiring } from '@/core/macros';
import { parseRequest } from '@/core/shared';
import { toWireMacroSummary } from './macroWireMappers';

export function createGetMacrosHandler(
  wiring: MacroWiring = {}
): (params: GetMacrosParams) => Promise<GetMacrosResult> {
  const service = createFoundryMacroService(wiring);

  return function getMacrosHandler(params: GetMacrosParams): Promise<GetMacrosResult> {
    try {
      const macros = service.listMacros(toListMacrosQuery(parseRequest(getMacrosRequestSchema, params)));
      return Promise.resolve(macros.map(toWireMacroSummary));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getMacrosHandler = createGetMacrosHandler();
