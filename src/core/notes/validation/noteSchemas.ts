import { z } from 'zod';
import { NOTE_TEXT_ANCHORS } from '@/core/notes/domain';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored,
// and so is a `textAnchor` outside its enum — the REST API forwards it unchecked.
// `null` clears a link, the label or a color; the core decides what it accepts.
// The newer fields (elevation, sort, font, lock, levels) have no legacy callers
// and are validated strictly; the core would round a fractional `sort`.

const clearableString = z.string().nullable().optional();

const noteAttributesShape = {
  entryId: clearableString,
  pageId: clearableString,
  text: clearableString,
  iconSrc: z.string().optional(),
  iconTint: clearableString,
  iconSize: z.number().optional(),
  fontSize: z.number().optional(),
  textAnchor: z.enum(NOTE_TEXT_ANCHORS).optional().catch(undefined),
  textColor: clearableString,
  global: z.boolean().optional(),
  elevation: z.number().optional(),
  sort: z.number().int().optional(),
  fontFamily: z.string().nullable().optional(),
  locked: z.boolean().optional(),
  levels: z.array(z.string().min(1)).optional()
};

export const getNotesRequestSchema = z.object({
  sceneId: z.string().optional()
});

export const createNoteRequestSchema = z.object({
  sceneId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  ...noteAttributesShape
});

export const updateNoteRequestSchema = z.object({
  sceneId: z.string().optional(),
  noteId: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  ...noteAttributesShape
});

export const deleteNoteRequestSchema = z.object({
  sceneId: z.string().optional(),
  noteId: z.string()
});

export type GetNotesRequest = z.infer<typeof getNotesRequestSchema>;
export type CreateNoteRequest = z.infer<typeof createNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof updateNoteRequestSchema>;
export type DeleteNoteRequest = z.infer<typeof deleteNoteRequestSchema>;
