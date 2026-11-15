import type { BrowseFilesQuery, CreateDirectoryCommand, UploadFileCommand } from '@/core/files/application';
import { StoragePath, parseBase64Payload, parseUploadFileName } from '@/core/files/domain';
import { emptyAsAbsent } from '@/core/shared';
import type { BrowseFilesRequest, CreateDirectoryRequest, UploadFileRequest } from './fileSchemas';

export function toBrowseFilesQuery(request: BrowseFilesRequest): BrowseFilesQuery {
  const extensions = (request.extensions ?? []).map((extension) =>
    `.${extension.replace(/^\./, '')}`.toLowerCase()
  );
  return {
    source: request.source ?? 'data',
    path: StoragePath.parse(request.path ?? ''),
    bucket: emptyAsAbsent(request.bucket) ?? null,
    extensions: [...new Set(extensions)],
    wildcard: request.wildcard ?? false
  };
}

export function toCreateDirectoryCommand(request: CreateDirectoryRequest): CreateDirectoryCommand {
  return { path: StoragePath.parse(request.path) };
}

export function toUploadFileCommand(request: UploadFileRequest): UploadFileCommand {
  const fileName = parseUploadFileName(request.fileName);
  const payload = parseBase64Payload(request.content);
  return {
    directory: StoragePath.parse(request.directory, 'directory'),
    file: {
      name: fileName.name,
      mediaType: fileName.mediaType,
      base64: payload.base64,
      byteLength: payload.byteLength
    },
    overwrite: request.overwrite ?? false
  };
}
