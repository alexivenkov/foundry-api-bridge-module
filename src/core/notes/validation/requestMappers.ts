import type {
  CreateNoteCommand,
  DeleteNoteCommand,
  ListNotesQuery,
  UpdateNoteCommand
} from '@/core/notes/application';
import type { NoteChanges } from '@/core/notes/domain';
import type {
  CreateNoteRequest,
  DeleteNoteRequest,
  GetNotesRequest,
  UpdateNoteRequest
} from './noteSchemas';

type NoteAttributesRequest = Omit<UpdateNoteRequest, 'sceneId' | 'noteId'>;

const SHORT_HEX = /^#[0-9a-f]{3}$/i;

/**
 * The core reads `#f80` as the number 0xf80 (`#000f80`), verified on Foundry
 * 13.351 and 14.368, so a short color is expanded; anything else is passed on
 * as before.
 */
function expandShortHex(color: string | null | undefined): string | null | undefined {
  if (typeof color !== 'string' || !SHORT_HEX.test(color)) {
    return color;
  }
  return color.replace(/[0-9a-f]/gi, (digit) => digit + digit);
}

/** The core renders a blank font with its default font. */
function emptyAsNull(value: string | null | undefined): string | null | undefined {
  return value === '' ? null : value;
}

function toNoteChanges(request: NoteAttributesRequest): NoteChanges {
  return {
    x: request.x,
    y: request.y,
    entryId: request.entryId,
    pageId: request.pageId,
    text: request.text,
    iconSrc: request.iconSrc,
    iconTint: expandShortHex(request.iconTint),
    iconSize: request.iconSize,
    fontSize: request.fontSize,
    textAnchor: request.textAnchor,
    textColor: expandShortHex(request.textColor),
    global: request.global,
    elevation: request.elevation,
    sort: request.sort,
    fontFamily: emptyAsNull(request.fontFamily),
    locked: request.locked,
    levels: request.levels
  };
}

export function toListNotesQuery(request: GetNotesRequest): ListNotesQuery {
  return { sceneId: request.sceneId };
}

export function toCreateNoteCommand(request: CreateNoteRequest): CreateNoteCommand {
  return {
    sceneId: request.sceneId,
    draft: { ...toNoteChanges(request), x: request.x, y: request.y }
  };
}

export function toUpdateNoteCommand(request: UpdateNoteRequest): UpdateNoteCommand {
  return {
    sceneId: request.sceneId,
    noteId: request.noteId,
    changes: toNoteChanges(request)
  };
}

export function toDeleteNoteCommand(request: DeleteNoteRequest): DeleteNoteCommand {
  return { sceneId: request.sceneId, noteId: request.noteId };
}
