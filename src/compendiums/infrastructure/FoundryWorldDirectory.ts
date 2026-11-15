import type { WorldDirectory, WorldDocumentRef, WorldFolderRef } from '@/compendiums/domain';
import type { PackManagementGameProvider } from './foundryPackManagementTypes';

export class FoundryWorldDirectory implements WorldDirectory {
  constructor(private readonly gameProvider: PackManagementGameProvider) {}

  findFolder(folderId: string): WorldFolderRef | null {
    const folder = this.gameProvider.getGame().folders.get(folderId);
    return folder ? { id: folder.id, name: folder.name, type: folder.type } : null;
  }

  findDocument(documentType: string, documentId: string): WorldDocumentRef | null {
    const document = this.gameProvider.getGame().collections.get(documentType)?.get(documentId);
    return document ? { id: document.id, name: document.name } : null;
  }

  existingDocumentIds(documentType: string, documentIds: readonly string[]): readonly string[] {
    const collection = this.gameProvider.getGame().collections.get(documentType);
    if (!collection) return [];
    return documentIds.filter(id => collection.has(id));
  }
}
