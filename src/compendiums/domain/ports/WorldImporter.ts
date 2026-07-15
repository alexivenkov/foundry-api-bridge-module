import type { CreatedActorView, CreatedItemView, ImportedWorldDocument } from '@/compendiums/domain/model';

export interface WorldImporter {
  /**
   * Create a world document of the given primary type (Actor, Item,
   * JournalEntry, ...) from raw source data.
   *
   * Returns null when the underlying create resolved to nothing.
   *
   * @throws WorldDocumentClassUnavailableError when no document class is
   *         registered for the type
   */
  createByDocumentType(
    documentType: string,
    data: Record<string, unknown>
  ): Promise<ImportedWorldDocument | null>;

  createActor(data: Record<string, unknown>): Promise<CreatedActorView>;

  createItem(data: Record<string, unknown>): Promise<CreatedItemView>;
}
