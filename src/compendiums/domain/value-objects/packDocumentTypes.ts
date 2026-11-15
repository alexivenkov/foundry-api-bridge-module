export const COMPENDIUM_PACK_TYPES: readonly string[] = Object.freeze([
  'ActiveEffect',
  'Actor',
  'Adventure',
  'Cards',
  'Item',
  'JournalEntry',
  'Macro',
  'Playlist',
  'RollTable',
  'Scene'
]);

// Pack types whose documents have a world collection. Adventure documents
// exist only in packs (imported through `Adventure#import`), ActiveEffect
// documents only on actors and items.
export const WORLD_DOCUMENT_PACK_TYPES: readonly string[] = Object.freeze([
  'Actor',
  'Cards',
  'Item',
  'JournalEntry',
  'Macro',
  'Playlist',
  'RollTable',
  'Scene'
]);

export const ADVENTURE_CONTENT_TYPES: readonly string[] = Object.freeze([
  'Actor',
  'Combat',
  'Item',
  'JournalEntry',
  'Scene',
  'RollTable',
  'Macro',
  'Cards',
  'Playlist',
  'Folder'
]);

export function isWorldDocumentPackType(documentType: string): boolean {
  return WORLD_DOCUMENT_PACK_TYPES.includes(documentType);
}

export function defaultDuplicateLabel(label: string): string {
  return `Copy of ${label}`;
}
