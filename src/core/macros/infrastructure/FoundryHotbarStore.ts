import {
  HotbarUserNotFoundError,
  MacroNotFoundError,
  type Hotbar,
  type HotbarAssignment,
  type HotbarMacro,
  type HotbarStore
} from '@/core/macros/domain';
import { hotbarGlobalsFromGlobalThis, type HotbarGlobalsProvider } from './foundryHotbarTypes';
import { toHotbar, toHotbarMacro } from './hotbarMapper';

/** Anti-corruption layer over `User#hotbar`; every write goes through `User#assignHotbarMacro`. */
export class FoundryHotbarStore implements HotbarStore {
  constructor(private readonly globals: HotbarGlobalsProvider = hotbarGlobalsFromGlobalThis) {}

  currentUserId(): string | null {
    return this.globals().game.user?.id ?? null;
  }

  findHotbar(userId: string): Hotbar | null {
    const { game } = this.globals();
    const user = game.users.get(userId);
    return user ? toHotbar(user, game) : null;
  }

  findMacro(macroId: string): HotbarMacro | null {
    const macro = this.globals().game.macros.get(macroId);
    return macro ? toHotbarMacro(macro) : null;
  }

  async assign(userId: string, assignment: HotbarAssignment): Promise<void> {
    const { game } = this.globals();
    const user = game.users.get(userId);
    if (!user) {
      throw new HotbarUserNotFoundError(userId);
    }
    let macro = null;
    if (assignment.macroId !== null) {
      macro = game.macros.get(assignment.macroId);
      if (!macro) {
        throw new MacroNotFoundError(assignment.macroId);
      }
    }
    const options = assignment.fromSlot !== undefined ? { fromSlot: assignment.fromSlot } : {};
    await user.assignHotbarMacro(macro, assignment.slot, options);
  }
}
