import type { FoundryScenesGame } from '@/core/shared';

/** The note's icon lives in `texture` (`BaseNote` schema, Foundry 13–14); there is no `icon` field. */
export interface FoundryNoteIcon {
  src?: string;
  tint?: string | null;
}

/**
 * The Note document fields the context reads and writes (`BaseNote`, Foundry
 * 13–14). `locked` and `levels` (a Set of Level ids) exist from 14 on; a
 * blank `fontFamily` means the default font.
 */
export interface FoundryNoteDocument {
  id: string;
  _id: string;
  x: number;
  y: number;
  entryId: string | null;
  pageId: string | null;
  text: string | null;
  texture: FoundryNoteIcon | undefined;
  iconSize: number;
  fontSize: number;
  textAnchor: number;
  textColor: string | null;
  global: boolean;
  elevation?: number | undefined;
  sort?: number | undefined;
  fontFamily?: string | null | undefined;
  locked?: boolean | undefined;
  levels?: Iterable<string> | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<FoundryNoteDocument>;
}

export interface FoundryNotesCollection {
  get(id: string): FoundryNoteDocument | undefined;
  contents: FoundryNoteDocument[];
}

/** `Scene#levels`, the embedded Level documents of Foundry 14. */
export interface FoundryNoteSceneLevels {
  contents: Array<{ id: string }>;
}

export interface FoundryNoteScene {
  id: string;
  notes: FoundryNotesCollection;
  levels?: FoundryNoteSceneLevels | undefined;
  createEmbeddedDocuments(type: 'Note', data: Record<string, unknown>[]): Promise<FoundryNoteDocument[]>;
  deleteEmbeddedDocuments(type: 'Note', ids: string[]): Promise<unknown[]>;
}

export type FoundryNoteGame = FoundryScenesGame<FoundryNoteScene>;
