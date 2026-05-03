import type { CreateNoteParams, CreateNoteResult } from '@/commands/types';
import { getSceneById, mapNoteToSummary, textAnchorToNumber } from './noteTypes';

export async function createNoteHandler(params: CreateNoteParams): Promise<CreateNoteResult> {
  const scene = getSceneById(params.sceneId);

  const data: Record<string, unknown> = { x: params.x, y: params.y };

  if (params.entryId !== undefined) {
    data['entryId'] = params.entryId;
  }
  if (params.pageId !== undefined) {
    data['pageId'] = params.pageId;
  }
  if (params.text !== undefined) {
    data['text'] = params.text;
  }
  if (params.iconSize !== undefined) {
    data['iconSize'] = params.iconSize;
  }
  if (params.fontSize !== undefined) {
    data['fontSize'] = params.fontSize;
  }
  if (params.textAnchor !== undefined) {
    data['textAnchor'] = textAnchorToNumber(params.textAnchor);
  }
  if (params.textColor !== undefined) {
    data['textColor'] = params.textColor;
  }
  if (params.global !== undefined) {
    data['global'] = params.global;
  }

  if (params.iconSrc !== undefined || params.iconTint !== undefined) {
    const icon: Record<string, unknown> = {};
    if (params.iconSrc !== undefined) {
      icon['src'] = params.iconSrc;
    }
    if (params.iconTint !== undefined) {
      icon['tint'] = params.iconTint;
    }
    data['icon'] = icon;
  }

  const created = await scene.createEmbeddedDocuments('Note', [data]);
  const note = created[0];

  if (!note) {
    throw new Error('Note creation returned no document');
  }

  return mapNoteToSummary(note);
}
