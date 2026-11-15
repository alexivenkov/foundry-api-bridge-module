import type { CreateDirectoryParams, CreateDirectoryResult } from '@/commands/types';
import {
  createDirectoryRequestSchema,
  createFoundryFileService,
  toCreateDirectoryCommand,
  type FileWiring
} from '@/core/files';
import { parseRequest } from '@/core/shared';

export function createCreateDirectoryHandler(
  wiring: FileWiring = {}
): (params: CreateDirectoryParams) => Promise<CreateDirectoryResult> {
  const service = createFoundryFileService(wiring);

  return async function createDirectoryHandler(params: CreateDirectoryParams): Promise<CreateDirectoryResult> {
    const command = toCreateDirectoryCommand(parseRequest(createDirectoryRequestSchema, params));
    const created = await service.createDirectory(command);
    return { source: 'data', path: created.path };
  };
}

export const createDirectoryHandler = createCreateDirectoryHandler();
