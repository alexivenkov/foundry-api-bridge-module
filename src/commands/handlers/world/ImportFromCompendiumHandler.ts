import type { ImportFromCompendiumParams, ImportFromCompendiumResult } from '@/commands/types';
import { getCompendiumGame } from './compendiumPackTypes';
import { getDocumentClassForType } from './worldDocumentClasses';

export async function importFromCompendiumHandler(
  params: ImportFromCompendiumParams
): Promise<ImportFromCompendiumResult> {
  const game = getCompendiumGame();
  const pack = game.packs?.get(params.packId);

  if (!pack) {
    throw new Error(`Pack not found: ${params.packId}`);
  }

  const documentType = pack.metadata.type;

  if (documentType === 'Adventure') {
    throw new Error(
      'Adventure import not supported via this command — use Foundry UI for Adventures'
    );
  }

  const compDoc = await pack.getDocument(params.documentId);
  if (!compDoc) {
    throw new Error(`Document not found in pack ${params.packId}: ${params.documentId}`);
  }

  const data = compDoc.toObject();
  delete data['_id'];

  if (params.name !== undefined) {
    data['name'] = params.name;
  }
  if (params.folder !== undefined) {
    data['folder'] = params.folder;
  }

  const docClass = getDocumentClassForType(documentType);
  if (!docClass) {
    throw new Error(`Document class not available for type: ${documentType}`);
  }

  const created = await docClass.create(data);
  if (!created) {
    throw new Error(`Failed to import document: ${params.documentId}`);
  }

  return {
    imported: true,
    worldId: created.id,
    uuid: created.uuid,
    name: created.name,
    documentType
  };
}
