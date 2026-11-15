import type { MacroChanges, MacroDraft } from '@/core/macros/domain';

export interface ListMacrosQuery {
  /** `undefined` lists every macro; a type name lists the macros of that type — none, if no such type exists. */
  readonly type: string | undefined;
}

export interface GetMacroQuery {
  readonly macroId: string;
}

export interface CreateMacroCommand {
  readonly draft: MacroDraft;
}

export interface UpdateMacroCommand {
  readonly macroId: string;
  readonly changes: MacroChanges;
}

export interface DeleteMacroCommand {
  readonly macroId: string;
}

export interface ExecuteMacroCommand {
  readonly macroId: string;
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  /** As received: it is judged only after the macro and its permission, so it stays unparsed until then. */
  readonly args: unknown;
}
