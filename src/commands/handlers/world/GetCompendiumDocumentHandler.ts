import type { GetCompendiumDocumentParams, CompendiumDocumentResult } from '@/commands/types';
import { getCompendiumGame } from './compendiumPackTypes';

export async function getCompendiumDocumentHandler(
  params: GetCompendiumDocumentParams
): Promise<CompendiumDocumentResult> {
  const game = getCompendiumGame();
  const pack = game.packs?.get(params.packId);

  if (!pack) {
    throw new Error(`Pack not found: ${params.packId}`);
  }

  const doc = await pack.getDocument(params.documentId);

  if (!doc) {
    throw new Error(`Document not found in pack ${params.packId}: ${params.documentId}`);
  }

  return {
    id: doc.id,
    uuid: doc.uuid,
    name: doc.name,
    type: doc.type ?? '',
    img: doc.img !== undefined && doc.img !== null ? doc.img : null,
    documentType: pack.metadata.type,
    data: doc.toObject()
  };
}
