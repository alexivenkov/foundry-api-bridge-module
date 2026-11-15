import {
  MACRO_DOCUMENT_TYPE,
  NO_SCRIPT_CONSENT,
  PackFolderNotFoundError,
  PackNotWorldDocumentTypeError,
  WorldIdCollisionError,
  isWorldDocumentPackType,
  packFolderSubtree
} from '@/compendiums/domain';
import type {
  PackFolderImportOutcome,
  PackImportOutcome,
  PackInfo,
  PackManager,
  ScriptMacroImportPolicy,
  WorldBulkImporter,
  WorldDirectory,
  WorldDocumentRef
} from '@/compendiums/domain';
import type { ImportPackCommand, ImportPackFolderCommand } from './managementCommands';
import { requirePackInfo, requireWorldFolder } from './packGuards';

export interface CompendiumBulkImportServiceDependencies {
  readonly packs: PackManager;
  readonly world: WorldDirectory;
  readonly importer: WorldBulkImporter;
  /** Absent: script macros are skipped. */
  readonly scripts?: ScriptMacroImportPolicy | undefined;
}

export class CompendiumBulkImportService {
  constructor(private readonly deps: CompendiumBulkImportServiceDependencies) {}

  async importPack(command: ImportPackCommand): Promise<PackImportOutcome> {
    const pack = this.requireImportablePack(command.packId);
    if (command.folderId !== undefined) {
      requireWorldFolder(this.deps.world, command.folderId, pack.type);
    }
    const skipped = await this.scriptMacrosToSkip(pack);
    const skippedIds = new Set((skipped ?? []).map(macro => macro.id));
    if (command.keepId) {
      const placements = await this.deps.importer.readDocumentPlacements(pack.id);
      this.refuseIdCollisions(pack, placements.map(placement => placement.id).filter(id => !skippedIds.has(id)));
    }

    const outcome = await this.deps.importer.importPack(pack.id, {
      folderId: command.folderId,
      folderName: command.folderName,
      keepId: command.keepId,
      ...(skippedIds.size > 0 ? { skipDocumentIds: [...skippedIds] } : {})
    });
    return skipped === undefined ? outcome : { ...outcome, skippedScriptMacros: skipped };
  }

  async importPackFolder(command: ImportPackFolderCommand): Promise<PackFolderImportOutcome> {
    const pack = this.requireImportablePack(command.packId);
    if (!pack.folders.some(folder => folder.id === command.packFolderId)) {
      throw new PackFolderNotFoundError(pack.id, command.packFolderId);
    }
    if (command.folderId !== undefined) {
      requireWorldFolder(this.deps.world, command.folderId, pack.type);
    }

    const folderIds = packFolderSubtree(pack.folders, command.packFolderId);
    const placements = await this.deps.importer.readDocumentPlacements(pack.id);
    const folderDocumentIds = placements
      .filter(placement => placement.folderId !== null && folderIds.includes(placement.folderId))
      .map(placement => placement.id);
    const skipped = (await this.scriptMacrosToSkip(pack))?.filter(macro => folderDocumentIds.includes(macro.id));
    const skippedIds = new Set((skipped ?? []).map(macro => macro.id));
    const documentIds = folderDocumentIds.filter(id => !skippedIds.has(id));
    if (command.keepId) {
      this.refuseIdCollisions(pack, documentIds);
    }

    const outcome = await this.deps.importer.importPackFolder(pack.id, {
      folderIds,
      documentIds,
      parentFolderId: command.folderId ?? null,
      keepId: command.keepId
    });
    return skipped === undefined ? outcome : { ...outcome, skippedScriptMacros: skipped };
  }

  /**
   * Only a Macro pack holds macros. Without the opt-in its script macros stay in the pack, as `create-macro` refuses
   * to create one; undefined when the opt-in is on or the pack is not a Macro pack.
   */
  private async scriptMacrosToSkip(pack: PackInfo): Promise<readonly WorldDocumentRef[] | undefined> {
    if (pack.type !== MACRO_DOCUMENT_TYPE || (this.deps.scripts ?? NO_SCRIPT_CONSENT).allowsScripts()) {
      return undefined;
    }
    return (await this.deps.importer.listScriptMacros?.(pack.id)) ?? [];
  }

  private requireImportablePack(packId: string): PackInfo {
    const pack = requirePackInfo(this.deps.packs, packId);
    if (!isWorldDocumentPackType(pack.type)) {
      throw new PackNotWorldDocumentTypeError(pack.id, pack.type);
    }
    return pack;
  }

  private refuseIdCollisions(pack: PackInfo, documentIds: readonly string[]): void {
    const collisions = this.deps.world.existingDocumentIds(pack.type, documentIds);
    if (collisions.length > 0) {
      throw new WorldIdCollisionError(pack.id, collisions.length);
    }
  }
}
