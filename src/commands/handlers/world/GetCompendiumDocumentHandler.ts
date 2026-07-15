import type { CompendiumDocumentResult, GetCompendiumDocumentParams } from '@/commands/types';
import {
  createFoundryCompendiumQueryService,
  getCompendiumDocumentRequestSchema,
  toGetPackDocumentQuery,
  type CompendiumGameProvider
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface GetCompendiumDocumentHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createGetCompendiumDocumentHandler(
  deps: GetCompendiumDocumentHandlerDependencies = {}
): (params: GetCompendiumDocumentParams) => Promise<CompendiumDocumentResult> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return async function getCompendiumDocumentHandler(
    params: GetCompendiumDocumentParams
  ): Promise<CompendiumDocumentResult> {
    const parsed = getCompendiumDocumentRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const result = await service.getDocument(toGetPackDocumentQuery(parsed.data));
    return {
      id: result.record.id,
      uuid: result.record.uuid,
      name: result.record.name,
      type: result.record.type,
      img: result.record.img,
      documentType: result.documentType,
      data: result.record.data
    };
  };
}

export const getCompendiumDocumentHandler = createGetCompendiumDocumentHandler();
