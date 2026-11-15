import type { NormalizeRollTableParams, RollTableResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  normalizeRollTableRequestSchema,
  toNormalizeRollTableCommand
} from '@/core/tables';
import { toWireRollTable, type RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createNormalizeRollTableHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: NormalizeRollTableParams) => Promise<RollTableResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function normalizeRollTableHandler(params: NormalizeRollTableParams): Promise<RollTableResult> {
    const command = toNormalizeRollTableCommand(parseRequest(normalizeRollTableRequestSchema, params));
    return toWireRollTable(await service.normalizeTable(command));
  };
}

export const normalizeRollTableHandler = createNormalizeRollTableHandler();
