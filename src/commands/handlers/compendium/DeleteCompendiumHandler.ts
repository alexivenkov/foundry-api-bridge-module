import type { DeleteCompendiumParams, DeleteCompendiumResult } from '@/commands/types';
import { createFoundryCompendiumManagementService, packIdRequestSchema } from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';

export function createDeleteCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: DeleteCompendiumParams) => Promise<DeleteCompendiumResult> {
  const service = createFoundryCompendiumManagementService(deps);

  return async function deleteCompendiumHandler(params: DeleteCompendiumParams): Promise<DeleteCompendiumResult> {
    const { packId } = parseRequest(packIdRequestSchema, params);
    const deleted = await service.delete(packId);
    return { deleted: true, packId: deleted.packId, label: deleted.label, documentCount: deleted.documentCount };
  };
}

export const deleteCompendiumHandler = createDeleteCompendiumHandler();
