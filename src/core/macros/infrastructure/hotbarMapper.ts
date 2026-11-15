import {
  MACRO_TYPES,
  isHotbarSlot,
  pageOfSlot,
  type Hotbar,
  type HotbarEntry,
  type HotbarMacro,
  type MacroType
} from '@/core/macros/domain';
import type { FoundryHotbarGame, FoundryHotbarMacro, FoundryHotbarUser } from './foundryHotbarTypes';

function toMacroType(type: string): MacroType {
  return (MACRO_TYPES as readonly string[]).includes(type) ? (type as MacroType) : 'chat';
}

export function toHotbarMacro(macro: FoundryHotbarMacro): HotbarMacro {
  return { id: macro.id, name: macro.name, type: toMacroType(macro.type) };
}

/** Reads `hotbar` itself rather than `getHotbarMacros`, which drops the id of a deleted macro. */
export function toHotbar(user: FoundryHotbarUser, game: FoundryHotbarGame): Hotbar {
  const entries: HotbarEntry[] = [];
  for (const [key, macroId] of Object.entries(user.hotbar ?? {})) {
    const slot = Number(key);
    if (!isHotbarSlot(slot) || typeof macroId !== 'string' || macroId === '') {
      continue;
    }
    const macro = game.macros.get(macroId);
    entries.push({ slot, page: pageOfSlot(slot), macroId, macro: macro ? toHotbarMacro(macro) : null });
  }
  entries.sort((a, b) => a.slot - b.slot);
  return { userId: user.id, userName: user.name, entries };
}
