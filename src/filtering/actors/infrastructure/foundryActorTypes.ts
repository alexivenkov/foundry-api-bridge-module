import type {
  FoundryFolderDocument,
  FoundryFoldersCollection
} from '@/kernel/infrastructure';

// Raw compendium source data (document source without the system's data
// preparation) keeps unset fields as explicit `null` — world actors rarely
// carry them, SRD packs do. Every field read from `system` must tolerate
// null in addition to undefined.

// Possible CR formats in D&D 5e:
//   - number  (legacy dnd5e versions)
//   - { value: number }  (dnd5e v3+)
//   - null  (raw compendium source data)
export type FoundryCrField = number | { value: number } | null | undefined;

export interface FoundryActorAbility {
  value: number | null;
}

export interface FoundryActorAbilities {
  str?: FoundryActorAbility | null;
  dex?: FoundryActorAbility | null;
  con?: FoundryActorAbility | null;
  int?: FoundryActorAbility | null;
  wis?: FoundryActorAbility | null;
  cha?: FoundryActorAbility | null;
}

export interface FoundryActorAttributes {
  hp?: { value?: number | null; max?: number | null } | null;
  ac?: { value?: number | null } | null;
  // dnd5e legacy may store level here as a fallback
  level?: number | null;
}

export interface FoundryActorDetails {
  cr?: FoundryCrField;
  level?: number | null;
  // creatureType may be `{ value: 'humanoid' }` (dnd5e v3+) or plain string (legacy)
  type?: { value?: string | null } | string | null;
}

export interface FoundryActorTraits {
  size?: string | null;
}

export interface FoundryActorSystem {
  details?: FoundryActorDetails | null;
  traits?: FoundryActorTraits | null;
  attributes?: FoundryActorAttributes | null;
  abilities?: FoundryActorAbilities | null;
}

export interface FoundryPrototypeToken {
  // Foundry CONST.TOKEN_DISPOSITIONS: -2..1
  disposition?: number;
}

export interface FoundryFolder {
  id: string;
}

export interface FoundryActor {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly hasPlayerOwner: boolean;
  readonly folder: FoundryFolder | null;
  readonly system: FoundryActorSystem;
  readonly prototypeToken?: FoundryPrototypeToken;
}

export interface FoundryActorsCollection {
  contents: readonly FoundryActor[];
}

// Folder document/collection types are owned by the shared kernel — re-exported
// here so existing actor-context consumers do not need to chase the new path.
export type { FoundryFolderDocument, FoundryFoldersCollection };

export interface FoundryGameGlobals {
  actors: FoundryActorsCollection;
  folders: FoundryFoldersCollection;
}

// Foundry CONST.TOKEN_DISPOSITIONS:
//   SECRET = -2, HOSTILE = -1, NEUTRAL = 0, FRIENDLY = 1
export const FOUNDRY_DISPOSITIONS = {
  SECRET: -2,
  HOSTILE: -1,
  NEUTRAL: 0,
  FRIENDLY: 1
} as const;
