import type { Note, NoteChanges, NoteTextAnchor } from '@/core/notes/domain';
import type { FoundryNoteDocument } from './foundryNoteTypes';

// CONST.TEXT_ANCHOR_POINTS, verified against Foundry 13.351 and 14.368.
const TEXT_ANCHOR_CODE: Readonly<Record<NoteTextAnchor, number>> = {
  center: 0,
  bottom: 1,
  top: 2,
  left: 3,
  right: 4
};

const TEXT_ANCHOR_BY_CODE: Readonly<Record<number, NoteTextAnchor>> = {
  0: 'center',
  1: 'bottom',
  2: 'top',
  3: 'left',
  4: 'right'
};

/** Fields a core may not store are left out, so they read as `undefined`. */
function toNoteDetails(document: FoundryNoteDocument): Pick<Note, 'elevation' | 'sort' | 'fontFamily' | 'locked' | 'levels'> {
  const details: { elevation?: number; sort?: number; fontFamily?: string | null; locked?: boolean; levels?: string[] } = {};
  if (document.elevation !== undefined) {
    details.elevation = document.elevation;
  }
  if (document.sort !== undefined) {
    details.sort = document.sort;
  }
  if (document.fontFamily !== undefined) {
    details.fontFamily = document.fontFamily !== null && document.fontFamily !== '' ? document.fontFamily : null;
  }
  if (document.locked !== undefined) {
    details.locked = document.locked;
  }
  if (document.levels !== undefined) {
    details.levels = [...document.levels];
  }
  return details;
}

export function toNote(document: FoundryNoteDocument): Note {
  return {
    id: document.id,
    x: document.x,
    y: document.y,
    entryId: document.entryId ?? null,
    pageId: document.pageId ?? null,
    text: document.text ?? null,
    iconSrc: document.texture?.src ?? '',
    iconTint: document.texture?.tint ?? null,
    iconSize: document.iconSize,
    fontSize: document.fontSize,
    textAnchor: TEXT_ANCHOR_BY_CODE[document.textAnchor] ?? 'center',
    textColor: document.textColor ?? null,
    global: document.global,
    ...toNoteDetails(document)
  };
}

const PLAIN_FIELDS = [
  'x',
  'y',
  'entryId',
  'pageId',
  'text',
  'iconSize',
  'fontSize',
  'textColor',
  'global',
  'elevation',
  'sort',
  'locked'
] as const;

/**
 * Only the attributes that are set become document fields; the icon goes to
 * `texture`. The default font is written as `''`, which both Foundry 13 and 14
 * render with `CONFIG.defaultFontFamily`.
 */
export function toFoundryNoteData(changes: NoteChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const field of PLAIN_FIELDS) {
    if (changes[field] !== undefined) {
      data[field] = changes[field];
    }
  }

  if (changes.textAnchor !== undefined) {
    data['textAnchor'] = TEXT_ANCHOR_CODE[changes.textAnchor];
  }

  if (changes.fontFamily !== undefined) {
    data['fontFamily'] = changes.fontFamily ?? '';
  }

  if (changes.levels !== undefined) {
    data['levels'] = [...new Set(changes.levels)];
  }

  if (changes.iconSrc !== undefined || changes.iconTint !== undefined) {
    const texture: Record<string, unknown> = {};
    if (changes.iconSrc !== undefined) {
      texture['src'] = changes.iconSrc;
    }
    if (changes.iconTint !== undefined) {
      texture['tint'] = changes.iconTint;
    }
    data['texture'] = texture;
  }

  return data;
}
