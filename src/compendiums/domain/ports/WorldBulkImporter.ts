import type {
  PackDocumentPlacement,
  PackFolderImportOutcome,
  PackFolderImportPlan,
  PackImportOptions,
  PackImportOutcome,
  WorldDocumentRef
} from '@/compendiums/domain/model';

export interface WorldBulkImporter {
  /** Every document of the pack with the pack folder that holds it. */
  readDocumentPlacements(packId: string): Promise<readonly PackDocumentPlacement[]>;

  /** The script-type Macro documents of a Macro pack. */
  listScriptMacros?(packId: string): Promise<readonly WorldDocumentRef[]>;

  /** The whole pack into a world folder (`CompendiumCollection#importAll`), without `skipDocumentIds`. */
  importPack(packId: string, options: PackImportOptions): Promise<PackImportOutcome>;

  /** One pack folder subtree with its documents. */
  importPackFolder(packId: string, plan: PackFolderImportPlan): Promise<PackFolderImportOutcome>;
}
