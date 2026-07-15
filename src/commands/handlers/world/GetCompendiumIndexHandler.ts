import type {
  GetCompendiumIndexParams,
  GetCompendiumIndexResult
} from '@/commands/types';
import {
  createFoundryCompendiumQueryService,
  getCompendiumIndexRequestSchema,
  toGetPackIndexQuery,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';
import { toWireIndexEntry } from './compendiumWireMappers';

export interface GetCompendiumIndexHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createGetCompendiumIndexHandler(
  deps: GetCompendiumIndexHandlerDependencies = {}
): (params: GetCompendiumIndexParams) => Promise<GetCompendiumIndexResult> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return async function getCompendiumIndexHandler(
    params: GetCompendiumIndexParams
  ): Promise<GetCompendiumIndexResult> {
    const parsed = getCompendiumIndexRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const result = await service.getIndex(toGetPackIndexQuery(parsed.data));
    return {
      packId: result.pack.id,
      packType: result.pack.type,
      packLabel: result.pack.label,
      total: result.total,
      entries: result.entries.map(toWireIndexEntry)
    };
  };
}

export const getCompendiumIndexHandler = createGetCompendiumIndexHandler();
