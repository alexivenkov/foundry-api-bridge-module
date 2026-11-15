export { NOTE_TEXT_ANCHORS } from './model/Note';
export type { Note, NoteChanges, NoteDraft, NoteTextAnchor } from './model/Note';
export { NoteNotFoundError } from './errors/NoteNotFoundError';
export { NoteCreationFailedError } from './errors/NoteCreationFailedError';
export { UnknownNoteLevelError } from './errors/UnknownNoteLevelError';
export type { NoteStore } from './ports/NoteStore';
export type { NoteEnvironment, NoteFeatures } from './ports/NoteEnvironment';
export { assertNoteFeatures, assertNoteLevels } from './rules/noteRules';
