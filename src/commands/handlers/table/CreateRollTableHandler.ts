import type { CreateRollTableParams, RollTableResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableService,
  createRollTableRequestSchema,
  toCreateRollTableCommand
} from '@/core/tables';
import { toWireRollTable, type RollTableHandlerDependencies } from './tableWireMappers';

export function createCreateRollTableHandler(
  deps: RollTableHandlerDependencies = {}
): (params: CreateRollTableParams) => Promise<RollTableResult> {
  const service = createFoundryRollTableService(deps.gameProvider);

  return async function createRollTableHandler(params: CreateRollTableParams): Promise<RollTableResult> {
    const command = toCreateRollTableCommand(parseRequest(createRollTableRequestSchema, params));
    return toWireRollTable(await service.createTable(command));
  };
}

export const createRollTableHandler = createCreateRollTableHandler();
