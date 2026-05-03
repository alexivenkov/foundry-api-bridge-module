import type { GetMacroParams, GetMacroResult } from '@/commands/types';
import { getGame, mapMacroToDetail } from './macroTypes';

export function getMacroHandler(params: GetMacroParams): Promise<GetMacroResult> {
  const macro = getGame().macros.get(params.macroId);
  if (!macro) {
    return Promise.reject(new Error(`Macro not found: ${params.macroId}`));
  }
  return Promise.resolve(mapMacroToDetail(macro));
}
