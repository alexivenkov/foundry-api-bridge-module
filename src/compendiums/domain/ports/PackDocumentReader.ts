import type { PackContentsFilter, PackDocumentRecord, PackDocumentView } from '@/compendiums/domain/model';

export interface PackDocumentReader {
  /**
   * Load documents of a pack as rich views (embedded actor items and journal
   * pages included). Without a filter this is a full `getDocuments()` load;
   * with a filter, selection happens server-side where the core supports it.
   *
   * @throws PackNotFoundError when the pack is unknown
   */
  readAllDocumentViews(
    packId: string,
    filter?: PackContentsFilter
  ): Promise<readonly PackDocumentView[]>;

  /**
   * Load a single document as a raw record (`data` = full source object).
   *
   * @throws PackNotFoundError when the pack is unknown
   * @throws PackDocumentNotFoundError when the document is not in the pack
   */
  readDocumentRecord(packId: string, documentId: string): Promise<PackDocumentRecord>;

  /**
   * Load the raw source object of a single document (for world imports).
   *
   * @throws PackNotFoundError when the pack is unknown
   * @throws PackDocumentNotFoundError when the document is not in the pack
   */
  readDocumentSource(
    packId: string,
    documentId: string
  ): Promise<Record<string, unknown>>;
}
