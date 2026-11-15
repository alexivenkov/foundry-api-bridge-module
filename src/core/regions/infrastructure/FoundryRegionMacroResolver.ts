import type { RegionMacroResolver } from '@/core/regions/domain';
import { regionGlobalsFromGlobalThis, type RegionGlobalsProvider } from './foundryRegionBehaviorTypes';

interface MacroLike {
  documentName?: unknown;
  type?: unknown;
}

/**
 * Resolves a macro UUID the way the executeMacro behavior does when it fires
 * (`foundry.utils.fromUuid`, which loads compendium documents). The core's UUID
 * field checks only the syntax and the document type, never that the macro exists.
 */
export class FoundryRegionMacroResolver implements RegionMacroResolver {
  constructor(private readonly globals: RegionGlobalsProvider = regionGlobalsFromGlobalThis) {}

  async findMacroType(macroUuid: string): Promise<string | null> {
    const globals = this.globals();
    const fromUuid = globals.foundry?.utils?.fromUuid ?? globals.fromUuid;
    if (fromUuid === undefined) {
      return null;
    }
    let document: unknown;
    try {
      document = await fromUuid(macroUuid);
    } catch {
      return null;
    }
    if (document === null || typeof document !== 'object') {
      return null;
    }
    const macro = document as MacroLike;
    return macro.documentName === 'Macro' && typeof macro.type === 'string' ? macro.type : null;
  }
}
