import type { UploadFileParams, UploadFileResult } from '@/commands/types';
import { createFoundryFileService, toUploadFileCommand, uploadFileRequestSchema, type FileWiring } from '@/core/files';
import { parseRequest } from '@/core/shared';

export function createUploadFileHandler(
  wiring: FileWiring = {}
): (params: UploadFileParams) => Promise<UploadFileResult> {
  const service = createFoundryFileService(wiring);

  return async function uploadFileHandler(params: UploadFileParams): Promise<UploadFileResult> {
    const command = toUploadFileCommand(parseRequest(uploadFileRequestSchema, params));
    const uploaded = await service.uploadFile(command);
    return { source: 'data', path: uploaded.path, size: uploaded.size, overwritten: uploaded.overwritten };
  };
}

export const uploadFileHandler = createUploadFileHandler();
