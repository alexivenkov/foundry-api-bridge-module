import type { DeleteNoteParams, DeleteNoteResult } from '@/commands/types';
import { getSceneById, getNote } from './noteTypes';

export async function deleteNoteHandler(params: DeleteNoteParams): Promise<DeleteNoteResult> {
  const scene = getSceneById(params.sceneId);
  getNote(scene, params.noteId);

  await scene.deleteEmbeddedDocuments('Note', [params.noteId]);

  return {
    deleted: true,
    noteId: params.noteId,
    sceneId: scene.id
  };
}
