import type {
  FoundryFolderDocument,
  FoundryFoldersCollection
} from '@/filtering/shared/infrastructure';

// D&D 5e price field — the modern shape carries an explicit denomination, but
// older versions sometimes store a plain number (treated as gp).
export interface FoundryPriceField {
  value?: unknown;
  denomination?: unknown;
}

// D&D 5e weight field — modern { value, units }, legacy plain number.
export interface FoundryWeightObject {
  value?: unknown;
  units?: unknown;
}

// Attunement varies dramatically across dnd5e versions:
//   - older: string ('none' | 'required' | 'attuned')
//   - mid:   number (0 | 1 | 2)
//   - newer: object ({ required: boolean, value?: number })
export type FoundryAttunementField = string | number | boolean | { required?: unknown };

// Activities are stored either as a Map<string, Activity> (newest dnd5e) or
// a plain record/object keyed by activity id.
export type FoundryActivitiesField = Record<string, unknown> | Map<string, unknown>;

export interface FoundryItemSystem {
  rarity?: unknown;
  identified?: unknown;
  weight?: unknown;
  price?: unknown;
  attunement?: FoundryAttunementField;
  level?: unknown;
  school?: unknown;
  activities?: FoundryActivitiesField;
}

export interface FoundryItemFolder {
  id: string;
}

export interface FoundryItem {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly folder: FoundryItemFolder | null;
  readonly system: FoundryItemSystem;
}

export interface FoundryItemsCollection {
  contents: readonly FoundryItem[];
}

export type { FoundryFolderDocument, FoundryFoldersCollection };

export interface FoundryItemGameGlobals {
  items: FoundryItemsCollection;
  folders: FoundryFoldersCollection;
}
