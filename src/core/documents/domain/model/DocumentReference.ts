/** Any document addressed by uuid: a world document, an embedded one, or a compendium document. */
export interface DocumentReference {
  readonly uuid: string;
  /** The core document name (`Actor`, `JournalEntryPage`, `Folder`, …). */
  readonly documentType: string;
  readonly id: string;
  readonly name: string | null;
  /** The compendium pack holding the document; null for world documents. */
  readonly packId: string | null;
  /** The parent of an embedded document; null for primary documents. */
  readonly parentUuid: string | null;
}

export function isEmbeddedDocument(document: DocumentReference): boolean {
  return document.parentUuid !== null;
}

export function isCompendiumDocument(document: DocumentReference): boolean {
  return document.packId !== null;
}
