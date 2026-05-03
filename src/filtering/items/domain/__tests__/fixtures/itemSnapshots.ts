import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';

export const LONGSWORD: ItemSnapshot = {
  id: 'item-longsword',
  name: 'Longsword',
  type: ItemType.Weapon,
  folderId: 'folder-weapons',
  rarity: ItemRarity.Common,
  identified: true,
  requiresAttunement: false,
  weight: 3,
  priceGp: 15,
  spellLevel: null,
  spellSchool: null,
  hasActivities: true,
  isContainer: false
};

export const POTION_OF_HEALING: ItemSnapshot = {
  id: 'item-potion-healing',
  name: 'Potion of Healing',
  type: ItemType.Consumable,
  folderId: 'folder-potions',
  rarity: ItemRarity.Common,
  identified: true,
  requiresAttunement: false,
  weight: 0.5,
  priceGp: 50,
  spellLevel: null,
  spellSchool: null,
  hasActivities: true,
  isContainer: false
};

export const RING_OF_PROTECTION: ItemSnapshot = {
  id: 'item-ring-protection',
  name: 'Ring of Protection',
  type: ItemType.Equipment,
  folderId: 'folder-magic',
  rarity: ItemRarity.Rare,
  identified: true,
  requiresAttunement: true,
  weight: 0,
  priceGp: 1000,
  spellLevel: null,
  spellSchool: null,
  hasActivities: false,
  isContainer: false
};

export const ARTIFACT_OF_DEAD: ItemSnapshot = {
  id: 'item-artifact-dead',
  name: 'Artifact of the Dead',
  type: ItemType.Equipment,
  folderId: 'folder-magic',
  rarity: ItemRarity.Artifact,
  identified: true,
  requiresAttunement: true,
  weight: 5,
  priceGp: 50000,
  spellLevel: null,
  spellSchool: null,
  hasActivities: true,
  isContainer: false
};

export const FIREBALL: ItemSnapshot = {
  id: 'item-fireball',
  name: 'Fireball',
  type: ItemType.Spell,
  folderId: 'folder-spells',
  rarity: null,
  identified: null,
  requiresAttunement: null,
  weight: null,
  priceGp: null,
  spellLevel: 3,
  spellSchool: SpellSchool.Evocation,
  hasActivities: true,
  isContainer: false
};

export const CANTRIP_LIGHT: ItemSnapshot = {
  id: 'item-light',
  name: 'Light',
  type: ItemType.Spell,
  folderId: 'folder-spells',
  rarity: null,
  identified: null,
  requiresAttunement: null,
  weight: null,
  priceGp: null,
  spellLevel: 0,
  spellSchool: SpellSchool.Evocation,
  hasActivities: false,
  isContainer: false
};

export const CASK: ItemSnapshot = {
  id: 'item-cask',
  name: 'Cask',
  type: ItemType.Container,
  folderId: null,
  rarity: null,
  identified: true,
  requiresAttunement: false,
  weight: 50,
  priceGp: 5,
  spellLevel: null,
  spellSchool: null,
  hasActivities: false,
  isContainer: true
};

export const UNKNOWN_RING: ItemSnapshot = {
  id: 'item-unknown-ring',
  name: 'Unknown Ring',
  type: ItemType.Equipment,
  folderId: 'folder-magic',
  rarity: ItemRarity.Rare,
  identified: false,
  requiresAttunement: true,
  weight: 0,
  priceGp: null,
  spellLevel: null,
  spellSchool: null,
  hasActivities: false,
  isContainer: false
};

export const ALL_FIXTURES: readonly ItemSnapshot[] = [
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  ARTIFACT_OF_DEAD,
  FIREBALL,
  CANTRIP_LIGHT,
  CASK,
  UNKNOWN_RING
] as const;
