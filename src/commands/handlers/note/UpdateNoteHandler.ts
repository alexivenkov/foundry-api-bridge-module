import type { UpdateNoteParams, UpdateNoteResult } from '@/commands/types';
import { getSceneById, getNote, mapNoteToSummary, textAnchorToNumber } from './noteTypes';

export async function updateNoteHandler(params: UpdateNoteParams): Promise<UpdateNoteResult> {
  const scene = getSceneById(params.sceneId);
  const note = getNote(scene, params.noteId);

  const updateData: Record<string, unknown> = {};

  if (params.x !== undefined) {
    updateData['x'] = params.x;
  }
  if (params.y !== undefined) {
    updateData['y'] = params.y;
  }
  if (params.entryId !== undefined) {
    updateData['entryId'] = params.entryId;
  }
  if (params.pageId !== undefined) {
    updateData['pageId'] = params.pageId;
  }
  if (params.text !== undefined) {
    updateData['text'] = params.text;
  }
  if (params.iconSize !== undefined) {
    updateData['iconSize'] = params.iconSize;
  }
  if (params.fontSize !== undefined) {
    updateData['fontSize'] = params.fontSize;
  }
  if (params.textAnchor !== undefined) {
    updateData['textAnchor'] = textAnchorToNumber(params.textAnchor);
  }
  if (params.textColor !== undefined) {
    updateData['textColor'] = params.textColor;
  }
  if (params.global !== undefined) {
    updateData['global'] = params.global;
  }

  if (params.iconSrc !== undefined || params.iconTint !== undefined) {
    const icon: Record<string, unknown> = {};
    if (params.iconSrc !== undefined) {
      icon['src'] = params.iconSrc;
    }
    if (params.iconTint !== undefined) {
      icon['tint'] = params.iconTint;
    }
    updateData['icon'] = icon;
  }

  const updated = await note.update(updateData);
  return mapNoteToSummary(updated);
}
