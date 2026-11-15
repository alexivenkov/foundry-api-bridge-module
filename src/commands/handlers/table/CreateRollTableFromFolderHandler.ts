import type { CreateRollTableFromFolderParams, RollTableResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  createRollTableFromFolderRequestSchema,
  toCreateRollTableFromFolderCommand
} from '@/core/tables';
import { toWireRollTable, type RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createCreateRollTableFromFolderHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: CreateRollTableFromFolderParams) => Promise<RollTableResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function createRollTableFromFolderHandler(
    params: CreateRollTableFromFolderParams
  ): Promise<RollTableResult> {
    const command = toCreateRollTableFromFolderCommand(parseRequest(createRollTableFromFolderRequestSchema, params));
    return toWireRollTable(await service.createFromFolder(command));
  };
}

export const createRollTableFromFolderHandler = createCreateRollTableFromFolderHandler();
