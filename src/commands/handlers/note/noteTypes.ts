import type { NoteSummary, NoteTextAnchor } from '@/commands/types';

export interface FoundryNoteIcon {
  src?: string;
  tint?: string | null;
}

export interface FoundryNoteDocument {
  id: string;
  _id: string;
  x: number;
  y: number;
  entryId: string | null;
  pageId: string | null;
  text: string | null;
  icon: FoundryNoteIcon | string | undefined;
  iconSize: number;
  fontSize: number;
  textAnchor: number;
  textColor: string | null;
  global: boolean;
  update(data: Record<string, unknown>): Promise<FoundryNoteDocument>;
  delete(): Promise<FoundryNoteDocument>;
}

export interface NotesCollection {
  get(id: string): FoundryNoteDocument | undefined;
  contents: FoundryNoteDocument[];
}

export interface NoteScene {
  id: string;
  notes: NotesCollection;
  createEmbeddedDocuments(type: 'Note', data: Record<string, unknown>[]): Promise<FoundryNoteDocument[]>;
  deleteEmbeddedDocuments(type: 'Note', ids: string[]): Promise<unknown[]>;
}

export interface NoteScenesCollection {
  get(id: string): NoteScene | undefined;
  active: NoteScene | null;
}

export interface NoteGame {
  scenes: NoteScenesCollection;
}

export function getGame(): NoteGame {
  return (globalThis as unknown as { game: NoteGame }).game;
}

export function getSceneById(sceneId: string | undefined): NoteScene {
  const game = getGame();

  if (sceneId === undefined) {
    if (!game.scenes.active) {
      throw new Error('No active scene; specify sceneId');
    }
    return game.scenes.active;
  }

  const scene = game.scenes.get(sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  return scene;
}

export function getNote(scene: NoteScene, noteId: string): FoundryNoteDocument {
  const note = scene.notes.get(noteId);
  if (!note) {
    throw new Error(`Note not found: ${noteId}`);
  }
  return note;
}

const TEXT_ANCHOR_TO_NUMBER: Record<NoteTextAnchor, number> = {
  center: 0,
  bottom: 1,
  top: 2,
  left: 3,
  right: 4
};

const TEXT_ANCHOR_FROM_NUMBER: Record<number, NoteTextAnchor> = {
  0: 'center',
  1: 'bottom',
  2: 'top',
  3: 'left',
  4: 'right'
};

export function textAnchorToNumber(value: NoteTextAnchor): number {
  return TEXT_ANCHOR_TO_NUMBER[value];
}

export function textAnchorFromNumber(value: number): NoteTextAnchor {
  return TEXT_ANCHOR_FROM_NUMBER[value] ?? 'center';
}

export function normalizeIcon(raw: FoundryNoteIcon | string | null | undefined): { src: string; tint: string | null } {
  if (raw === undefined || raw === null) {
    return { src: '', tint: null };
  }
  if (typeof raw === 'string') {
    return { src: raw, tint: null };
  }
  return { src: raw.src ?? '', tint: raw.tint ?? null };
}

export function mapNoteToSummary(note: FoundryNoteDocument): NoteSummary {
  const iconNormalized = normalizeIcon(note.icon);
  return {
    id: note.id,
    x: note.x,
    y: note.y,
    entryId: note.entryId ?? null,
    pageId: note.pageId ?? null,
    text: note.text ?? null,
    iconSrc: iconNormalized.src,
    iconTint: iconNormalized.tint,
    iconSize: note.iconSize,
    fontSize: note.fontSize,
    textAnchor: textAnchorFromNumber(note.textAnchor),
    textColor: note.textColor ?? null,
    global: note.global
  };
}
