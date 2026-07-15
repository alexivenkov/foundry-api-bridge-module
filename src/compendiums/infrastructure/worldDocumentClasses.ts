export interface WorldDocumentLike {
  id: string;
  uuid: string;
  name: string;
}

export interface WorldDocumentCreator {
  create(data: Record<string, unknown>): Promise<WorldDocumentLike | null | undefined>;
}

export const SUPPORTED_DOCUMENT_TYPES: readonly string[] = [
  'Actor',
  'Item',
  'JournalEntry',
  'Scene',
  'RollTable',
  'Macro',
  'Cards',
  'Playlist'
] as const;

export function getDocumentClassForType(type: string): WorldDocumentCreator | undefined {
  const globals = globalThis as unknown as Record<string, unknown>;
  const klass = globals[type];
  if (klass === undefined || klass === null) return undefined;
  if (typeof (klass as { create?: unknown }).create !== 'function') return undefined;
  return klass as WorldDocumentCreator;
}
