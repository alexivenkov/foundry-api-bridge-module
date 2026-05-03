import type { GetNotesParams, GetNotesResult } from '@/commands/types';
import { getSceneById, mapNoteToSummary } from './noteTypes';

export function getNotesHandler(params: GetNotesParams): Promise<GetNotesResult> {
  try {
    const scene = getSceneById(params.sceneId);
    const notes = scene.notes.contents.map(mapNoteToSummary);
    return Promise.resolve({ sceneId: scene.id, notes });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
