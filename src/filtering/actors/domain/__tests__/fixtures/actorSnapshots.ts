import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import { ActorType } from '@/filtering/actors/domain/value-objects/ActorType';
import { CreatureType } from '@/filtering/actors/domain/value-objects/CreatureType';
import { Disposition } from '@/filtering/actors/domain/value-objects/Disposition';
import { Size } from '@/filtering/actors/domain/value-objects/Size';

export const GANDALF: ActorSnapshot = {
  id: 'actor-gandalf',
  name: 'Gandalf the Grey',
  type: ActorType.Character,
  hasPlayerOwner: true,
  folderId: 'folder-pcs',
  creatureType: null,
  size: Size.Medium,
  disposition: Disposition.Friendly,
  cr: null,
  level: 18,
  hp: { current: 145, max: 145 },
  ac: 17,
  abilities: { str: 10, dex: 14, con: 16, int: 22, wis: 20, cha: 18 }
};

export const FRODO: ActorSnapshot = {
  id: 'actor-frodo',
  name: 'Frodo Baggins',
  type: ActorType.Character,
  hasPlayerOwner: true,
  folderId: 'folder-pcs',
  creatureType: null,
  size: Size.Small,
  disposition: Disposition.Friendly,
  cr: null,
  level: 4,
  hp: { current: 28, max: 32 },
  ac: 13,
  abilities: { str: 10, dex: 16, con: 14, int: 12, wis: 14, cha: 12 }
};

export const GOBLIN: ActorSnapshot = {
  id: 'actor-goblin',
  name: 'Goblin Warrior',
  type: ActorType.Npc,
  hasPlayerOwner: false,
  folderId: 'folder-npcs',
  creatureType: CreatureType.Humanoid,
  size: Size.Small,
  disposition: Disposition.Hostile,
  cr: 0.25,
  level: null,
  hp: { current: 7, max: 7 },
  ac: 15,
  abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 }
};

export const ANCIENT_RED_DRAGON: ActorSnapshot = {
  id: 'actor-dragon',
  name: 'Ancient Red Dragon',
  type: ActorType.Npc,
  hasPlayerOwner: false,
  folderId: null,
  creatureType: CreatureType.Dragon,
  size: Size.Gargantuan,
  disposition: Disposition.Hostile,
  cr: 24,
  level: null,
  hp: { current: 546, max: 546 },
  ac: 22,
  abilities: { str: 30, dex: 10, con: 29, int: 18, wis: 15, cha: 23 }
};

export const WAGON: ActorSnapshot = {
  id: 'actor-wagon',
  name: 'Wooden Wagon',
  type: ActorType.Vehicle,
  hasPlayerOwner: false,
  folderId: 'folder-vehicles',
  creatureType: null,
  size: Size.Large,
  disposition: Disposition.Neutral,
  cr: null,
  level: null,
  hp: { current: 50, max: 50 },
  ac: 12,
  abilities: null
};

export const PARTY_GROUP: ActorSnapshot = {
  id: 'actor-party',
  name: 'The Fellowship',
  type: ActorType.Group,
  hasPlayerOwner: true,
  folderId: 'folder-groups',
  creatureType: null,
  size: null,
  disposition: Disposition.Friendly,
  cr: null,
  level: null,
  hp: null,
  ac: null,
  abilities: null
};

export const ALL_FIXTURES: readonly ActorSnapshot[] = [
  GANDALF,
  FRODO,
  GOBLIN,
  ANCIENT_RED_DRAGON,
  WAGON,
  PARTY_GROUP
] as const;
