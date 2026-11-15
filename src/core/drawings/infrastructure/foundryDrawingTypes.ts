import type { FoundryScenesGame } from '@/core/shared';

/**
 * The persisted drawing data (`BaseDrawing` schema, Foundry 13.351 and
 * 14.368). The mapper reads `_source`: the document's own fields hold `Color`
 * objects and the author as a `User` document.
 */
export interface FoundryDrawingSource {
  _id: string;
  /** Foundry 14+. */
  name?: string | null;
  author?: string | null;
  /** `ShapeData`: type `r` / `e` / `p` (`c` is not drawn by the canvas). */
  shape?: { type?: string; width?: number | null; height?: number | null; points?: number[] };
  x?: number;
  y?: number;
  elevation?: number;
  /** Foundry 14+. */
  levels?: string[];
  sort?: number;
  rotation?: number;
  bezierFactor?: number;
  fillType?: number;
  fillColor?: string | null;
  fillAlpha?: number;
  strokeWidth?: number;
  strokeColor?: string | null;
  strokeAlpha?: number;
  texture?: string | null;
  text?: string | null;
  /** Foundry 13 stores the default font's name, Foundry 14 an empty string. */
  fontFamily?: string | null;
  fontSize?: number;
  textColor?: string | null;
  textAlpha?: number;
  hidden?: boolean;
  locked?: boolean;
  interface?: boolean;
}

export interface FoundryDrawingDocument {
  id: string;
  _source: FoundryDrawingSource;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryDrawingsCollection {
  get(id: string): FoundryDrawingDocument | undefined;
  contents: FoundryDrawingDocument[];
}

export interface FoundryDrawingScene {
  id: string;
  name?: string;
  drawings: FoundryDrawingsCollection;
  createEmbeddedDocuments(type: 'Drawing', data: Record<string, unknown>[]): Promise<FoundryDrawingDocument[]>;
  deleteEmbeddedDocuments(type: 'Drawing', ids: string[]): Promise<unknown[]>;
}

export interface FoundryDrawingGame extends FoundryScenesGame<FoundryDrawingScene> {
  users: { get(id: string): unknown };
}
