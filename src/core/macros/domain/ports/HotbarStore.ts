import type { Hotbar, HotbarAssignment, HotbarMacro } from '@/core/macros/domain/model/Hotbar';

// Reads are synchronous: users and macros live in memory.
export interface HotbarStore {
  /** The user the module runs as; null before the game knows it. */
  currentUserId(): string | null;
  /** Null when there is no such user. */
  findHotbar(userId: string): Hotbar | null;
  findMacro(macroId: string): HotbarMacro | null;
  assign(userId: string, assignment: HotbarAssignment): Promise<void>;
}
