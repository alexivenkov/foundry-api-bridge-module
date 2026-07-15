import type { CompendiumData, CompendiumDocument, ItemData, JournalPageData } from '@/types/foundry';
import type { GetCompendiumParams } from '@/commands/types';
import {
  PackNotFoundError,
  createFoundryCompendiumQueryService,
  getCompendiumRequestSchema,
  toGetPackContentsQuery,
  type CompendiumGameProvider,
  type PackDocumentView
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface GetCompendiumHandlerDependencies {
  gameProvider?: CompendiumGameProvider;
}

export function createGetCompendiumHandler(
  deps: GetCompendiumHandlerDependencies = {}
): (params: GetCompendiumParams) => Promise<CompendiumData> {
  const service = createFoundryCompendiumQueryService(deps.gameProvider);

  return async function getCompendiumHandler(
    params: GetCompendiumParams
  ): Promise<CompendiumData> {
    const parsed = getCompendiumRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    try {
      const result = await service.getPackContents(toGetPackContentsQuery(parsed.data));
      return {
        id: result.pack.id,
        label: result.pack.label,
        type: result.pack.type,
        system: result.pack.system,
        documentCount: result.documentCount,
        documents: result.documents.map(toWireDocument)
      };
    } catch (error) {
      // Legacy wire flavor of this command differs from the domain wording.
      if (error instanceof PackNotFoundError) {
        throw new Error(`Compendium not found: ${error.packId}`);
      }
      throw error;
    }
  };
}

function toWireDocument(view: PackDocumentView): CompendiumDocument {
  const document: CompendiumDocument = {
    id: view.id,
    uuid: view.uuid,
    name: view.name,
    type: view.type,
    img: view.img
  };

  if (view.system !== undefined) {
    document.system = view.system;
  }
  if (view.items !== undefined) {
    document.items = view.items.map(
      (item): ItemData => ({
        id: item.id,
        name: item.name,
        type: item.type,
        img: item.img,
        system: item.system
      })
    );
  }
  if (view.pages !== undefined) {
    document.pages = view.pages.map(
      (page): JournalPageData => ({
        id: page.id,
        name: page.name,
        type: page.type,
        text: page.text,
        markdown: page.markdown,
        enrichedText: page.enrichedText,
        src: page.src
      })
    );
  }

  return document;
}

export const getCompendiumHandler = createGetCompendiumHandler();
