import { refuseNewScriptCarriers } from '@/kernel';
import {
  DOCUMENT_TRANSFER_MAX_BYTES,
  DocumentCreationFailedError,
  DocumentNotFoundError,
  ImportFolderNotFoundError,
  ImportFolderTypeMismatchError,
  requireJsonSize,
  requireScriptImportAllowed,
  requireTransferableDocumentType,
  type DocumentExporter,
  type DocumentImporter,
  type ExportedDocument,
  type ImportedDocument,
  type ScriptContentPolicy,
  type TransferableDocumentType
} from '@/core/documents/domain';
import type { DocumentQuery, ImportDocumentCommand } from './commands';

export interface DocumentTransferServiceDependencies {
  readonly exporter: DocumentExporter;
  readonly importer: DocumentImporter;
  readonly scripts: ScriptContentPolicy;
}

export class DocumentTransferService {
  constructor(private readonly deps: DocumentTransferServiceDependencies) {}

  async exportDocument(query: DocumentQuery): Promise<ExportedDocument> {
    const document = await this.deps.exporter.findDocument(query.uuid);
    if (document === null) {
      throw new DocumentNotFoundError(query.uuid);
    }
    // Checked before the core serializes anything: a User record carries a password hash.
    requireTransferableDocumentType(document.documentType);
    const data = await this.deps.exporter.exportDocument(query.uuid);
    if (data === null) {
      throw new DocumentNotFoundError(query.uuid);
    }
    requireJsonSize(`The exported ${document.documentType}`, data, DOCUMENT_TRANSFER_MAX_BYTES);
    return { document, data };
  }

  async importDocument(command: ImportDocumentCommand): Promise<ImportedDocument> {
    const documentType = requireTransferableDocumentType(command.documentType);
    requireJsonSize('The document data', command.data, DOCUMENT_TRANSFER_MAX_BYTES);
    const folderId = command.folderId ?? null;
    if (folderId !== null) {
      this.requireFolder(folderId, documentType);
    }
    const scripts = await this.deps.importer.findScriptContent(documentType, command.data);
    requireScriptImportAllowed(scripts, this.deps.scripts);
    refuseNewScriptCarriers(documentType, command.data, () => this.deps.scripts.allowsScripts());

    const imported = await this.deps.importer.importDocument(documentType, command.data, folderId);
    if (imported === null) {
      throw new DocumentCreationFailedError(documentType);
    }
    return imported;
  }

  private requireFolder(folderId: string, documentType: TransferableDocumentType): void {
    const folder = this.deps.importer.findFolder(folderId);
    if (folder === null) {
      throw new ImportFolderNotFoundError(folderId);
    }
    if (folder.type !== documentType) {
      throw new ImportFolderTypeMismatchError(folderId, folder.type, documentType);
    }
  }
}
