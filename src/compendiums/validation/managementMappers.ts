import type {
  ConfigurePackCommand,
  CreatePackCommand,
  DeletePackDocumentCommand,
  DuplicatePackCommand,
  ExportDocumentCommand,
  ExportFolderCommand,
  GetAdventureQuery,
  ImportAdventureCommand,
  ImportPackCommand,
  ImportPackFolderCommand,
  UpdatePackDocumentCommand
} from '@/compendiums/application';
import type {
  ConfigureCompendiumRequest,
  CreateCompendiumRequest,
  DuplicateCompendiumRequest,
  ExportFolderToCompendiumRequest,
  ExportToCompendiumRequest,
  GetAdventureRequest,
  ImportAdventureRequest,
  ImportCompendiumFolderRequest,
  ImportCompendiumRequest,
  PackDocumentRequest,
  UpdateCompendiumDocumentRequest
} from './managementSchemas';

export function toCreatePackCommand(request: CreateCompendiumRequest): CreatePackCommand {
  return { label: request.label, documentType: request.documentType, folderId: request.folderId };
}

export function toDuplicatePackCommand(request: DuplicateCompendiumRequest): DuplicatePackCommand {
  return { packId: request.packId, label: request.label, folderId: request.folderId };
}

export function toConfigurePackCommand(request: ConfigureCompendiumRequest): ConfigurePackCommand {
  const ownership = request.ownership;
  return {
    packId: request.packId,
    locked: request.locked,
    ownership:
      ownership === undefined || ownership === null
        ? ownership
        : {
            ...(ownership.player !== undefined ? { player: ownership.player } : {}),
            ...(ownership.trusted !== undefined ? { trusted: ownership.trusted } : {}),
            ...(ownership.assistant !== undefined ? { assistant: ownership.assistant } : {})
          },
    folderId: request.folderId
  };
}

export function toExportDocumentCommand(request: ExportToCompendiumRequest): ExportDocumentCommand {
  return {
    packId: request.packId,
    documentId: request.documentId,
    name: request.name,
    folderId: request.folderId
  };
}

export function toExportFolderCommand(request: ExportFolderToCompendiumRequest): ExportFolderCommand {
  return {
    packId: request.packId,
    folderId: request.folderId,
    packFolderId: request.packFolderId,
    keepFolders: request.keepFolders ?? false,
    updateByName: request.updateByName ?? false,
    keepId: request.keepId ?? false
  };
}

export function toUpdatePackDocumentCommand(request: UpdateCompendiumDocumentRequest): UpdatePackDocumentCommand {
  return {
    packId: request.packId,
    documentId: request.documentId,
    name: request.name,
    folderId: request.folderId,
    changes: request.changes
  };
}

export function toDeletePackDocumentCommand(request: PackDocumentRequest): DeletePackDocumentCommand {
  return { packId: request.packId, documentId: request.documentId };
}

export function toImportPackCommand(request: ImportCompendiumRequest): ImportPackCommand {
  return {
    packId: request.packId,
    folderId: request.folderId,
    folderName: request.folderName,
    keepId: request.keepId ?? false
  };
}

export function toImportPackFolderCommand(request: ImportCompendiumFolderRequest): ImportPackFolderCommand {
  return {
    packId: request.packId,
    packFolderId: request.packFolderId,
    folderId: request.folderId,
    keepId: request.keepId ?? false
  };
}

export function toGetAdventureQuery(request: GetAdventureRequest): GetAdventureQuery {
  return { packId: request.packId, adventureId: request.adventureId };
}

export function toImportAdventureCommand(request: ImportAdventureRequest): ImportAdventureCommand {
  return {
    packId: request.packId,
    adventureId: request.adventureId,
    documentTypes: request.documentTypes,
    overwrite: request.overwrite ?? false
  };
}
