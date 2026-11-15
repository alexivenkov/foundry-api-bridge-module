import type { MacroArguments } from '@/core/macros/domain/rules/macroArguments';
import type { Macro, MacroChanges, MacroDraft } from '@/core/macros/domain/model/Macro';

// Reads are synchronous: the macro directory lives in memory. `createMacro`
// resolves to null when the core created nothing (a hook may veto a creation);
// `updateMacro` when the macro is gone.
export interface MacroStore {
  listMacros(): readonly Macro[];
  findMacro(macroId: string): Macro | null;
  createMacro(draft: MacroDraft): Promise<Macro | null>;
  updateMacro(macroId: string, changes: MacroChanges): Promise<Macro | null>;
  deleteMacro(macroId: string): Promise<void>;
}

/** Whether the world lets this module create, change and run script macros. */
export interface ScriptMacroPolicy {
  allowsScriptMacros(): boolean;
}

/** What a macro runs with: an actor and a token to speak as, and the caller's arguments. */
export interface MacroRunContext {
  readonly actorId?: string | undefined;
  readonly tokenId?: string | undefined;
  readonly args?: MacroArguments | undefined;
}

export interface MacroRunner {
  /** Compiles a script the way the core will, without running it: the compiler's message, or null. */
  findSyntaxError(script: string): string | null;
  hasActor(actorId: string): boolean;
  /** Tokens are looked up on the scene the canvas shows. */
  hasCanvasToken(tokenId: string): boolean;
  /**
   * Resolves to whatever the macro returned — any value at all, meant for
   * `serializeMacroResult` and nothing else. Rejects with what the macro threw.
   */
  run(macroId: string, context: MacroRunContext): Promise<unknown>;
}
