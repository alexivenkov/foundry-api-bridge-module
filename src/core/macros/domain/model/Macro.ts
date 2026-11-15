export const MACRO_TYPES = ['chat', 'script'] as const;
export type MacroType = (typeof MACRO_TYPES)[number];

export const MACRO_SCOPES = ['global', 'actors', 'actor'] as const;
export type MacroScope = (typeof MACRO_SCOPES)[number];

/** A macro of the world's macro directory. */
export interface Macro {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: MacroType;
  readonly img: string;
  readonly command: string;
  readonly scope: MacroScope;
  readonly folderName: string | null;
  readonly authorId: string | null;
}

/**
 * The attributes a caller may set. An omitted one is left to the core default
 * (create) or untouched (update); a `null` folder is the root of the directory.
 */
export interface MacroChanges {
  readonly name?: string | undefined;
  readonly type?: MacroType | undefined;
  readonly command?: string | undefined;
  readonly scope?: MacroScope | undefined;
  readonly img?: string | undefined;
  readonly folderId?: string | null | undefined;
}

export interface MacroDraft extends MacroChanges {
  readonly name: string;
}
