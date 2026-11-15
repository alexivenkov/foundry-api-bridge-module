import type {
  AdventureHeader,
  AdventureImportOutcome,
  AdventureImportPlan,
  AdventureImportRequest
} from '@/compendiums/domain/model';

export interface AdventureGateway {
  /** The core exposes `Adventure#prepareImport` and `Adventure#import`. */
  isAvailable(): boolean;

  /** The document types an adventure of this Foundry version can hold. */
  contentTypes(): readonly string[];

  readAdventure(packId: string, adventureId: string): Promise<AdventureHeader | null>;

  /** `documentTypes` absent: everything. Folders of the selected types always come along. */
  planImport(
    packId: string,
    adventureId: string,
    documentTypes?: readonly string[]
  ): Promise<AdventureImportPlan>;

  /**
   * Runs the core import without its dialog. Without `allowOverwrite` the
   * import aborts before writing when it would replace a world document.
   * Null when a `preImportAdventure` hook cancelled it.
   *
   * @throws AdventureOverwriteRefusedError when it would overwrite without `allowOverwrite`
   */
  importAdventure(
    packId: string,
    adventureId: string,
    request: AdventureImportRequest
  ): Promise<AdventureImportOutcome | null>;
}
