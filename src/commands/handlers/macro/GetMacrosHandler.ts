import type { GetMacrosParams, GetMacrosResult } from '@/commands/types';
import { getGame, mapMacroToSummary } from './macroTypes';

export function getMacrosHandler(params: GetMacrosParams): Promise<GetMacrosResult> {
  const all = getGame().macros.contents;
  const filtered = params.type !== undefined
    ? all.filter(m => m.type === params.type)
    : all;
  return Promise.resolve(filtered.map(mapMacroToSummary));
}
