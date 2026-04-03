declare const game: Game;

interface SettingConfig {
  name: string;
  hint?: string;
  scope: 'world' | 'client';
  config: boolean;
  type: typeof String | typeof Number | typeof Boolean | typeof Object | typeof Array;
  default: unknown;
  requiresReload?: boolean;
}

interface SettingMenuConfig {
  name: string;
  label: string;
  hint: string;
  icon: string;
  type: typeof FormApplication;
  restricted: boolean;
}

interface ClientSettings {
  register(namespace: string, key: string, config: SettingConfig): void;
  registerMenu(namespace: string, key: string, config: SettingMenuConfig): void;
  get(namespace: string, key: string): unknown;
  set(namespace: string, key: string, value: unknown): Promise<unknown>;
}

declare global {
  interface Game {
    settings: ClientSettings;
  }
}

export interface JournalData {
  id: string;
  uuid: string;
  name: string;
  folder: string | null;
  pages: JournalPageData[];
}

export interface JournalPageData {
  id: string;
  name: string;
  type: string;
  text: string | null;
  markdown: string | null;
}

export interface ItemData {
  id: string;
  uuid?: string;
  name: string;
  type: string;
  img: string;
  folder?: string | null;
  system: Record<string, unknown>;
}

export interface CompendiumMetadata {
  id: string;
  label: string;
  type: string;
  system: string;
  packageName: string;
  documentCount: number;
}

export interface CompendiumData {
  id: string;
  label: string;
  type: string;
  system: string;
  documentCount: number;
  documents: CompendiumDocument[];
}

export interface CompendiumDocument {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  system?: Record<string, unknown>;
  items?: ItemData[];
  pages?: JournalPageData[];
}
