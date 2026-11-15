import type {
  CreateFolderCommand,
  DeleteFolderCommand,
  GetFolderQuery,
  ListFoldersQuery,
  UpdateFolderCommand
} from '@/core/folders/application';
import type {
  CreateFolderRequest,
  DeleteFolderRequest,
  GetFolderRequest,
  GetFoldersRequest,
  UpdateFolderRequest
} from './folderSchemas';

export function toListFoldersQuery(request: GetFoldersRequest): ListFoldersQuery {
  return { type: request.type };
}

export function toGetFolderQuery(request: GetFolderRequest): GetFolderQuery {
  return {
    folderId: request.folderId,
    tree: {
      includeSubfolders: request.includeSubfolders !== false,
      includeContents: request.includeContents === true
    }
  };
}

export function toCreateFolderCommand(request: CreateFolderRequest): CreateFolderCommand {
  return {
    draft: {
      name: request.name,
      type: request.type,
      parentId: request.parentId,
      color: request.color,
      description: request.description,
      sort: request.sort
    }
  };
}

export function toUpdateFolderCommand(request: UpdateFolderRequest): UpdateFolderCommand {
  return {
    folderId: request.folderId,
    changes: {
      name: request.name,
      parentId: request.parentId,
      color: request.color,
      description: request.description,
      sort: request.sort
    }
  };
}

export function toDeleteFolderCommand(request: DeleteFolderRequest): DeleteFolderCommand {
  return {
    folderId: request.folderId,
    options: { deleteSubfolders: request.deleteSubfolders, deleteContents: request.deleteContents }
  };
}
