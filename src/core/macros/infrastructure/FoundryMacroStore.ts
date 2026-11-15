import type { Macro, MacroChanges, MacroDraft, MacroStore } from '@/core/macros/domain';
import { macroGlobalsFromGlobalThis, type MacroGlobalsProvider } from './foundryMacroTypes';
import { toFoundryMacroChanges, toFoundryMacroData, toMacro } from './macroMapper';

/** Anti-corruption layer over the world's Macro documents. */
export class FoundryMacroStore implements MacroStore {
  constructor(private readonly globals: MacroGlobalsProvider = macroGlobalsFromGlobalThis) {}

  listMacros(): readonly Macro[] {
    return this.globals().game.macros.contents.map(toMacro);
  }

  findMacro(macroId: string): Macro | null {
    const document = this.globals().game.macros.get(macroId);
    return document ? toMacro(document) : null;
  }

  async createMacro(draft: MacroDraft): Promise<Macro | null> {
    const document = await this.globals().Macro.create(toFoundryMacroData(draft));
    return document ? toMacro(document) : null;
  }

  async updateMacro(macroId: string, changes: MacroChanges): Promise<Macro | null> {
    const document = this.globals().game.macros.get(macroId);
    if (!document) {
      return null;
    }
    await document.update(toFoundryMacroChanges(changes));
    return toMacro(document);
  }

  async deleteMacro(macroId: string): Promise<void> {
    await this.globals().game.macros.get(macroId)?.delete();
  }
}
