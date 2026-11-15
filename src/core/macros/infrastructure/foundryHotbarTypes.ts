/** A Macro document as far as the hotbar reads it. */
export interface FoundryHotbarMacro {
  id: string;
  name: string;
  type: string;
}

/**
 * The client `User` document's hotbar (`BaseUser#hotbar`, an ObjectField of
 * slot "1"–"50" → macro id) and `User#assignHotbarMacro`, identical in Foundry
 * 13.351 and 14.368. A GM may update any user (`BaseUser.#canUpdate`).
 */
export interface FoundryHotbarUser {
  id: string;
  name: string;
  hotbar: Record<string, string> | null | undefined;
  /** Rejects with a plain Error for an invalid slot or a value that is not a Macro document. */
  assignHotbarMacro(
    macro: FoundryHotbarMacro | null,
    slot: number,
    options?: { fromSlot?: number }
  ): Promise<unknown>;
}

export interface FoundryHotbarGame {
  users: { get(id: string): FoundryHotbarUser | undefined };
  user?: { id: string } | null | undefined;
  macros: { get(id: string): FoundryHotbarMacro | undefined };
}

export interface FoundryHotbarGlobals {
  game: FoundryHotbarGame;
}

export type HotbarGlobalsProvider = () => FoundryHotbarGlobals;

/** Reads the globals on every call, so a gateway can be built before Foundry is ready. */
export const hotbarGlobalsFromGlobalThis: HotbarGlobalsProvider = () => globalThis as unknown as FoundryHotbarGlobals;
