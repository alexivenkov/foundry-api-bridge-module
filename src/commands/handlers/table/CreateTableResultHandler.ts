import type { CreateTableResultParams, TableResultEntryResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  createTableResultRequestSchema,
  toCreateTableResultCommand
} from '@/core/tables';
import { toWireTableResult, type RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createCreateTableResultHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: CreateTableResultParams) => Promise<TableResultEntryResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function createTableResultHandler(params: CreateTableResultParams): Promise<TableResultEntryResult> {
    const command = toCreateTableResultCommand(parseRequest(createTableResultRequestSchema, params));
    const result = await service.createResult(command);
    return { tableId: command.tableId, result: toWireTableResult(result) };
  };
}

export const createTableResultHandler = createCreateTableResultHandler();
