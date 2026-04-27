// Possible CR formats in D&D 5e:
//   - number  (legacy dnd5e versions)
//   - { value: number }  (dnd5e v3+)
export type FoundryCrField = number | { value: number } | undefined;

export interface FoundryActorAbility {
  value: number;
}

export interface FoundryActorAbilities {
  str?: FoundryActorAbility;
  dex?: FoundryActorAbility;
  con?: FoundryActorAbility;
  int?: FoundryActorAbility;
  wis?: FoundryActorAbility;
  cha?: FoundryActorAbility;
}

export interface FoundryActorAttributes {
  hp?: { value?: number; max?: number };
  ac?: { value?: number };
  // dnd5e legacy may store level here as a fallback
  level?: number;
}

export interface FoundryActorDetails {
  cr?: FoundryCrField;
  level?: number;
  // creatureType may be `{ value: 'humanoid' }` (dnd5e v3+) or plain string (legacy)
  type?: { value?: string } | string;
}

export interface FoundryActorTraits {
  size?: string;
}

export interface FoundryActorSystem {
  details?: FoundryActorDetails;
  traits?: FoundryActorTraits;
  attributes?: FoundryActorAttributes;
  abilities?: FoundryActorAbilities;
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

export interface FoundryFolderDocument {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly parent: FoundryFolderDocument | null;
  getSubfolders(recursive: boolean): FoundryFolderDocument[];
}

export interface FoundryFoldersCollection {
  get(id: string): FoundryFolderDocument | undefined;
  contents: readonly FoundryFolderDocument[];
}

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
