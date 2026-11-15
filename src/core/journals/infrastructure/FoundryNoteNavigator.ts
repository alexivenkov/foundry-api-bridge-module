import type { JournalNoteNavigator, JournalSceneNote, NotePanView } from '@/core/journals/domain';
import type { FoundryJournalCanvas, JournalGlobalsProvider } from './foundryJournalTypes';

/**
 * `JournalEntry#panToNote` (13.351, 14.368) animates the canvas to
 * `JournalEntry#sceneNote`: the first placed note of the entry on the viewed
 * scene, found the same way here. Both answer nothing while the canvas is not ready.
 */
export class FoundryNoteNavigator implements JournalNoteNavigator {
  constructor(private readonly globals: JournalGlobalsProvider) {}

  viewedSceneId(): string | null {
    return this.readyCanvas()?.scene?.id ?? null;
  }

  findSceneNote(journalId: string): JournalSceneNote | null {
    const canvas = this.readyCanvas();
    const scene = canvas?.scene;
    if (!canvas || !scene) {
      return null;
    }
    const note = canvas.notes?.placeables.find((placeable) => placeable.document.entryId === journalId);
    if (note === undefined) {
      return null;
    }
    return { noteId: note.document.id, sceneId: scene.id, x: note.document.x, y: note.document.y };
  }

  async panToNote(journalId: string, view: NotePanView): Promise<void> {
    const options: { scale?: number; duration?: number } = {};
    if (view.scale !== undefined) {
      options.scale = view.scale;
    }
    if (view.duration !== undefined) {
      options.duration = view.duration;
    }
    await this.globals().game.journal?.get(journalId)?.panToNote?.(options);
  }

  private readyCanvas(): FoundryJournalCanvas | null {
    const canvas = this.globals().canvas;
    return canvas?.ready ? canvas : null;
  }
}
