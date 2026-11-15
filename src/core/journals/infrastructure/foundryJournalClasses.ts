import type { FoundryJournalClass, FoundryJournalGlobals, FoundryTextEditorClass } from './foundryJournalTypes';

// Foundry 13 moved these classes under `foundry.*`; the bare globals remain as
// aliases that log a deprecation warning and are announced to go in 15
// (verified on 13.351 and 14.368). The namespaced class goes first, so the
// alias is not even read where the namespace exists. Foundry 11 and 12 have
// only the globals.

export function resolveJournalClass(globals: FoundryJournalGlobals): FoundryJournalClass {
  return globals.foundry?.documents?.collections?.Journal ?? globals.Journal;
}

/** The configured editor, `TextEditor.implementation`: what the global alias resolves to as well. */
export function resolveTextEditor(globals: FoundryJournalGlobals): FoundryTextEditorClass | undefined {
  return globals.foundry?.applications?.ux?.TextEditor?.implementation ?? globals.TextEditor;
}
