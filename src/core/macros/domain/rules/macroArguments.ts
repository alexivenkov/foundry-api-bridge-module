/** What a caller hands to a macro: a script reads it as `args`, a chat macro ignores it. */
export type MacroArguments = Record<string, unknown>;

export function isMacroArguments(value: unknown): value is MacroArguments {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
