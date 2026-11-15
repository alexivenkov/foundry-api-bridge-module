import { globalGameProvider } from '@/core/shared';
import { RollTableManagementService, RollTableService } from './application';
import {
  FoundryRollTableStore,
  FoundryRollTableWorkshop,
  FoundryTableLookups,
  FoundryTableRollFormulas,
  globalTableRollGlobals,
  type FoundryRollTableGame,
  type FoundryRollTableWorkshopGame,
  type RollTableGameProvider,
  type RollTableWorkshopGameProvider,
  type TableRollGlobalsProvider
} from './infrastructure';

export const defaultRollTableGameProvider: RollTableGameProvider = globalGameProvider<FoundryRollTableGame>();
export const defaultRollTableWorkshopGameProvider: RollTableWorkshopGameProvider =
  globalGameProvider<FoundryRollTableWorkshopGame>();

// Composition root of the context. Handlers pass custom providers only in tests.
export function createFoundryRollTableService(
  gameProvider: RollTableGameProvider = defaultRollTableGameProvider
): RollTableService {
  return new RollTableService({ tables: new FoundryRollTableStore(gameProvider) });
}

export function createFoundryRollTableManagementService(
  gameProvider: RollTableWorkshopGameProvider = defaultRollTableWorkshopGameProvider,
  rollGlobals: TableRollGlobalsProvider = globalTableRollGlobals
): RollTableManagementService {
  const workshop = new FoundryRollTableWorkshop(gameProvider, rollGlobals);
  const lookups = new FoundryTableLookups(gameProvider);
  return new RollTableManagementService({
    tables: new FoundryRollTableStore(gameProvider),
    roller: workshop,
    editor: workshop,
    folders: lookups,
    formulas: new FoundryTableRollFormulas(rollGlobals),
    compendiums: lookups
  });
}
