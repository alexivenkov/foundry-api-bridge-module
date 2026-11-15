import { findScriptCarriers, introducedScriptCarriers, refuseScriptCarriers } from '@/kernel';
import {
  FolderExportFailedError,
  MACRO_DOCUMENT_TYPE,
  NO_SCRIPT_CONSENT,
  PackDocumentExportFailedError,
  PackDocumentNotFoundError,
  PackFolderNotFoundError,
  PackNotWorldDocumentTypeError,
  ScriptMacroImportDisabledError,
  WorldDocumentNotFoundError,
  isScriptMacroSource,
  isWorldDocumentPackType
} from '@/compendiums/domain';
import type {
  FolderExportOutcome,
  PackContentWriter,
  PackDocumentRef,
  PackInfo,
  PackManager,
  ScriptMacroImportPolicy,
  WorldDirectory
} from '@/compendiums/domain';
import type {
  DeletePackDocumentCommand,
  DeletedPackDocument,
  ExportDocumentCommand,
  ExportFolderCommand,
  ExportedDocument,
  UpdatePackDocumentCommand
} from './managementCommands';
import { requireUnlockedPack, requireWorldFolder } from './packGuards';

export interface CompendiumWritingServiceDependencies {
  readonly packs: PackManager;
  readonly world: WorldDirectory;
  readonly writer: PackContentWriter;
  /** Absent: data that automation modules would run is refused. */
  readonly scripts?: ScriptMacroImportPolicy | undefined;
}

// Writes go only into an unlocked pack; a locked one is refused, never
// unlocked implicitly.
export class CompendiumWritingService {
  constructor(private readonly deps: CompendiumWritingServiceDependencies) {}

  async exportDocument(command: ExportDocumentCommand): Promise<ExportedDocument> {
    const pack = requireUnlockedPack(this.deps.packs, command.packId);
    if (!isWorldDocumentPackType(pack.type)) {
      throw new PackNotWorldDocumentTypeError(pack.id, pack.type);
    }
    if (this.deps.world.findDocument(pack.type, command.documentId) === null) {
      throw new WorldDocumentNotFoundError(pack.type, command.documentId);
    }
    requirePackFolder(pack, command.folderId);

    const document = await this.deps.writer.exportWorldDocument(pack.id, {
      documentId: command.documentId,
      name: command.name,
      folderId: command.folderId
    });
    if (document === null) {
      throw new PackDocumentExportFailedError(pack.id, command.documentId);
    }
    return { packId: pack.id, sourceId: command.documentId, document };
  }

  async exportFolder(command: ExportFolderCommand): Promise<FolderExportOutcome> {
    const pack = requireUnlockedPack(this.deps.packs, command.packId);
    requireWorldFolder(this.deps.world, command.folderId, pack.type);
    requirePackFolder(pack, command.packFolderId);

    const outcome = await this.deps.writer.exportWorldFolder(pack.id, command.folderId, {
      packFolderId: command.packFolderId,
      keepFolders: command.keepFolders,
      updateByName: command.updateByName,
      keepId: command.keepId
    });
    if (outcome === null) {
      throw new FolderExportFailedError(pack.id, command.folderId);
    }
    return outcome;
  }

  async updateDocument(command: UpdatePackDocumentCommand): Promise<PackDocumentRef> {
    const pack = requireUnlockedPack(this.deps.packs, command.packId);
    if (typeof command.folderId === 'string') {
      requirePackFolder(pack, command.folderId);
    }
    await this.requireDocument(pack.id, command.documentId);
    await this.refuseScriptMacroWrite(pack, command);
    await this.refuseNewScriptCarriers(pack, command);

    return this.deps.writer.updateDocument(pack.id, command.documentId, {
      name: command.name,
      folderId: command.folderId,
      changes: command.changes
    });
  }

  async deleteDocument(command: DeletePackDocumentCommand): Promise<DeletedPackDocument> {
    const pack = requireUnlockedPack(this.deps.packs, command.packId);
    const document = await this.requireDocument(pack.id, command.documentId);

    await this.deps.writer.deleteDocument(pack.id, command.documentId);
    return { packId: pack.id, documentId: document.id, name: document.name };
  }

  /**
   * A carrier written into a pack would reach the world with the next import, so a pack write obeys the opt-in like
   * a world write. A carrier the document already holds with the same value stays editable.
   */
  private async refuseNewScriptCarriers(pack: PackInfo, command: UpdatePackDocumentCommand): Promise<void> {
    const write: Record<string, unknown> = { ...(command.changes ?? {}) };
    if (command.name !== undefined) write['name'] = command.name;
    const found = findScriptCarriers(pack.type, write);
    if (found.length === 0) return;
    const stored = (await this.deps.writer.readDocumentSource?.(pack.id, command.documentId)) ?? null;
    const introduced = introducedScriptCarriers(found, stored === null ? [] : findScriptCarriers(pack.type, stored));
    refuseScriptCarriers(introduced, () => (this.deps.scripts ?? NO_SCRIPT_CONSENT).allowsScripts());
  }

  /** As `update-macro` in the world: a script macro may not be touched, and nothing may become one. */
  private async refuseScriptMacroWrite(pack: PackInfo, command: UpdatePackDocumentCommand): Promise<void> {
    if (pack.type !== MACRO_DOCUMENT_TYPE) return;
    const becomesScript = isScriptMacroSource(command.changes ?? {});
    const stored = becomesScript ? null : await this.deps.writer.readDocumentSource?.(pack.id, command.documentId);
    if ((becomesScript || isScriptMacroSource(stored ?? {})) && !(this.deps.scripts ?? NO_SCRIPT_CONSENT).allowsScripts()) {
      throw new ScriptMacroImportDisabledError();
    }
  }

  private async requireDocument(packId: string, documentId: string): Promise<PackDocumentRef> {
    const document = await this.deps.writer.findDocument(packId, documentId);
    if (document === null) {
      throw new PackDocumentNotFoundError(packId, documentId);
    }
    return document;
  }
}

function requirePackFolder(pack: PackInfo, folderId: string | undefined): void {
  if (folderId !== undefined && !pack.folders.some(folder => folder.id === folderId)) {
    throw new PackFolderNotFoundError(pack.id, folderId);
  }
}
