import { PackDocumentNotFoundError } from '@/compendiums/domain';
import type {
  FolderExportOptions,
  FolderExportOutcome,
  PackContentWriter,
  PackDocumentChanges,
  PackDocumentRef,
  WorldDocumentExport
} from '@/compendiums/domain';
import type {
  FoundryManagedPack,
  FoundryWorldFolder,
  PackManagementGameProvider
} from './foundryPackManagementTypes';
import { toPackDocumentRef } from './packInfoMapper';

export class FoundryPackContentWriter implements PackContentWriter {
  constructor(private readonly gameProvider: PackManagementGameProvider) {}

  async findDocument(packId: string, documentId: string): Promise<PackDocumentRef | null> {
    const document = await this.findPack(packId)?.getDocument(documentId);
    return document ? toPackDocumentRef(document) : null;
  }

  async readDocumentSource(packId: string, documentId: string): Promise<Readonly<Record<string, unknown>> | null> {
    const document = await this.findPack(packId)?.getDocument(documentId);
    if (!document) return null;
    return document.toObject?.() ?? { ...document._source };
  }

  // The clone carries the new name / pack folder the way the core's compendium
  // drop does (`entry.clone(updates, {keepId: true})`). `keepId: false` makes
  // v14's `importDocument` (which defaults to keeping the id and then replaces
  // a pack document with that id) create a new document, as v13 always does.
  async exportWorldDocument(packId: string, request: WorldDocumentExport): Promise<PackDocumentRef | null> {
    const game = this.gameProvider.getGame();
    const pack = game.packs.get(packId);
    const source = pack ? game.collections.get(pack.metadata.type)?.get(request.documentId) : undefined;
    if (!pack || !source) return null;

    const updates: Record<string, unknown> = {};
    if (request.name !== undefined) updates['name'] = request.name;
    if (request.folderId !== undefined) updates['folder'] = request.folderId;
    const document = Object.keys(updates).length > 0 ? source.clone(updates, { keepId: true }) : source;

    const created = await pack.importDocument(document, {
      keepId: false,
      clearFolder: request.folderId === undefined
    });
    return created ? toPackDocumentRef(created) : null;
  }

  // `Folder#exportToCompendium` reports a refused folder tree (too deep, a
  // failed scene thumbnail) as a notification and returns it instead of the pack.
  async exportWorldFolder(
    packId: string,
    folderId: string,
    options: FolderExportOptions
  ): Promise<FolderExportOutcome | null> {
    const game = this.gameProvider.getGame();
    const pack = game.packs.get(packId);
    const folder = game.folders.get(folderId);
    if (!pack || !folder) return null;

    const before = new Set((await pack.getIndex()).keys());
    const exportOptions: Record<string, unknown> = {
      updateByName: options.updateByName,
      keepId: options.keepId,
      keepFolders: options.keepFolders
    };
    if (options.packFolderId !== undefined) exportOptions['folder'] = options.packFolderId;

    const result = await folder.exportToCompendium(pack, exportOptions);
    if (result !== pack) return null;

    const index = await pack.getIndex();
    const createdCount = [...index.keys()].filter(id => !before.has(id)).length;
    const exportedCount = countFolderDocuments(folder);
    return {
      exportedCount,
      createdCount,
      updatedCount: Math.max(0, exportedCount - createdCount),
      documentCount: index.size
    };
  }

  async updateDocument(
    packId: string,
    documentId: string,
    changes: PackDocumentChanges
  ): Promise<PackDocumentRef> {
    const document = await this.findPack(packId)?.getDocument(documentId);
    if (!document) {
      throw new PackDocumentNotFoundError(packId, documentId);
    }

    const update: Record<string, unknown> = { ...(changes.changes ?? {}) };
    if (changes.name !== undefined) update['name'] = changes.name;
    if (changes.folderId !== undefined) update['folder'] = changes.folderId;
    if (Object.keys(update).length > 0) {
      await document.update(update);
    }
    return toPackDocumentRef(document);
  }

  async deleteDocument(packId: string, documentId: string): Promise<void> {
    const document = await this.findPack(packId)?.getDocument(documentId);
    await document?.delete();
  }

  private findPack(packId: string): FoundryManagedPack | undefined {
    return this.gameProvider.getGame().packs.get(packId);
  }
}

function countFolderDocuments(folder: FoundryWorldFolder): number {
  return folder
    .getSubfolders(true)
    .reduce((total, subfolder) => total + subfolder.contents.length, folder.contents.length);
}
