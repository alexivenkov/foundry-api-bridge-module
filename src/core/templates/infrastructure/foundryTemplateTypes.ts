import type { FoundryScenesGame } from '@/core/shared';

/**
 * The persisted template data (`BaseMeasuredTemplate` schema, Foundry 13.351).
 * The mapper reads `_source`: the document's own fields hold `Color` objects and
 * the author as a `User` document. Foundry 14 has no such document.
 */
export interface FoundryTemplateSource {
  _id: string;
  author?: string | null;
  /** CONST.MEASURED_TEMPLATE_TYPES: `circle`, `cone`, `rect`, `ray`. */
  t?: string;
  x?: number;
  y?: number;
  elevation?: number;
  sort?: number;
  distance?: number;
  direction?: number;
  angle?: number;
  width?: number;
  borderColor?: string | null;
  fillColor?: string | null;
  texture?: string | null;
  hidden?: boolean;
}

export interface FoundryTemplateDocument {
  id: string;
  _source: FoundryTemplateSource;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryTemplatesCollection {
  get(id: string): FoundryTemplateDocument | undefined;
  contents: FoundryTemplateDocument[];
}

export interface FoundryTemplateScene {
  id: string;
  name?: string;
  templates: FoundryTemplatesCollection;
  grid?: { distance?: number } | null;
  createEmbeddedDocuments(type: 'MeasuredTemplate', data: Record<string, unknown>[]): Promise<FoundryTemplateDocument[]>;
  deleteEmbeddedDocuments(type: 'MeasuredTemplate', ids: string[]): Promise<unknown[]>;
}

export interface FoundryTemplateGame extends FoundryScenesGame<FoundryTemplateScene> {
  users: { get(id: string): unknown };
}

/** `CONFIG.MeasuredTemplate.defaults`: what the template tools give a new cone (degrees) and ray (grid squares). */
export interface FoundryTemplateConfig {
  MeasuredTemplate?: { defaults?: { angle?: number; width?: number } };
}
