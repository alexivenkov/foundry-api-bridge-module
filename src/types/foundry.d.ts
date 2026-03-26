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
  interface SessionInfo {
    tier: string;
    features: {
      compendiums: boolean;
      commands: string[];
    };
  }

  interface Window {
    FoundryAPIBridge: {
      collectWorldData: () => WorldData;
      sendDataToServer: (data: WorldData) => Promise<void>;
      startUpdateLoop: () => void;
      stopUpdateLoop: () => void;
      collectCompendiumMetadata: () => CompendiumMetadata[];
      loadCompendiumContents: (packId: string) => Promise<CompendiumData | null>;
      sendCompendiumToServer: (packId: string, packData: CompendiumData) => Promise<void>;
      loadAndSendCompendium: (packId: string) => Promise<void>;
      autoLoadCompendium: () => Promise<void>;
      getSession: () => SessionInfo | null;
      API_SERVER_URL: string;
      UPDATE_INTERVAL: number;
      AUTO_LOAD_COMPENDIUM: string[];
    };
  }

  interface Game {
    settings: ClientSettings;
  }
}

export interface WorldData {
  world: {
    id: string;
    title: string;
    system: string;
    systemVersion: string;
    foundryVersion: string;
  };
  counts: {
    journals: number;
    actors: number;
    items: number;
    scenes: number;
  };
  journals: JournalData[];
  actors: ActorData[];
  scenes: SceneData[];
  items: ItemData[];
  compendiumMeta: CompendiumMetadata[];
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

export interface ActorData {
  id: string;
  uuid: string;
  name: string;
  type: string;
  folder: string | null;
  img: string;
  system: Record<string, unknown>;
  items: ItemData[];
}

export interface SceneData {
  id: string;
  uuid: string;
  name: string;
  active: boolean;
  folder: string | null;
  img: string;
  width: number;
  height: number;
  grid: { size: number; type: number; units: string; distance: number };
  darkness: number;
  notes: { x: number; y: number; text: string; label: string; entryId: string | null }[];
  walls: { c: number[]; move: number; sense: number; door: number }[];
  lights: { x: number; y: number; bright: number; dim: number; color: string | null; angle: number; walls: boolean; hidden: boolean }[];
  tiles: { x: number; y: number; width: number; height: number; img: string; hidden: boolean; elevation: number; rotation: number }[];
  drawings: { x: number; y: number; shape: { type: string; width: number; height: number; points: number[] }; text: string; hidden: boolean; fillColor: string | null; strokeColor: string | null }[];
  regions: { id: string; name: string; color: string | null; shapes: { type: string }[] }[];
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
