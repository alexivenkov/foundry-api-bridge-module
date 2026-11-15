import type { NoteSummary } from '@/commands/types';
import type { Note } from '@/core/notes';

export function toWireNote(note: Note): NoteSummary {
  const summary: NoteSummary = {
    id: note.id,
    x: note.x,
    y: note.y,
    entryId: note.entryId,
    pageId: note.pageId,
    text: note.text,
    iconSrc: note.iconSrc,
    iconTint: note.iconTint,
    iconSize: note.iconSize,
    fontSize: note.fontSize,
    textAnchor: note.textAnchor,
    textColor: note.textColor,
    global: note.global
  };
  if (note.elevation !== undefined) {
    summary.elevation = note.elevation;
  }
  if (note.sort !== undefined) {
    summary.sort = note.sort;
  }
  if (note.fontFamily !== undefined) {
    summary.fontFamily = note.fontFamily;
  }
  if (note.locked !== undefined) {
    summary.locked = note.locked;
  }
  if (note.levels !== undefined) {
    summary.levels = [...note.levels];
  }
  return summary;
}
