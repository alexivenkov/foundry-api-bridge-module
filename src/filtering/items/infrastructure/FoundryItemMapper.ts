import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  ItemRarity,
  ItemType,
  Price,
  SpellLevel,
  SpellSchool,
  Weight,
  parseItemRarity,
  parseItemType,
  parseSpellSchool
} from '@/filtering/items/domain/value-objects';

import type {
  FoundryActivitiesField,
  FoundryAttunementField,
  FoundryItem
} from './foundryItemTypes';

const CONTAINER_TYPE = ItemType.Container;

// Foundry stores spell schools as 3-letter abbreviations. The wire DTO and
// the SpellSchool enum use full words; this map translates between them.
// FOUNDRY-specific edge case — schema knowledge stays in the mapper.
const FOUNDRY_SCHOOL_CODE_TO_FULL: ReadonlyMap<string, SpellSchool> =
  new Map<string, SpellSchool>([
    ['abj', SpellSchool.Abjuration],
    ['con', SpellSchool.Conjuration],
    ['div', SpellSchool.Divination],
    ['enc', SpellSchool.Enchantment],
    ['evo', SpellSchool.Evocation],
    ['ill', SpellSchool.Illusion],
    ['nec', SpellSchool.Necromancy],
    ['trs', SpellSchool.Transmutation]
  ]);

export class FoundryItemMapper {
  toSnapshot(raw: FoundryItem): ItemSnapshot {
    const type = this.extractItemType(raw.type);
    return {
      id: raw.id,
      name: raw.name,
      type,
      folderId: raw.folder?.id ?? null,
      rarity: this.extractRarity(raw),
      identified: this.extractIdentified(raw),
      requiresAttunement: this.extractRequiresAttunement(raw),
      weight: Weight.normalize(raw.system.weight),
      priceGp: Price.normalizeToGp(raw.system.price),
      spellLevel: this.extractSpellLevel(raw, type),
      spellSchool: this.extractSpellSchool(raw, type),
      hasActivities: this.extractHasActivities(raw),
      isContainer: type === CONTAINER_TYPE
    };
  }

  // Foundry-side item.type may be a non-core value injected by a custom system.
  // We only filter by the documented core types; anything unknown is silently
  // mapped to ItemType.Loot — keeps the item visible to filters without putting
  // it in a misleading bucket.
  private extractItemType(raw: string): ItemType {
    try {
      return parseItemType(raw);
    } catch {
      return ItemType.Loot;
    }
  }

  // FOUNDRY-specific edge case: dnd5e versions use either 'veryRare' (camelCase)
  // or 'very rare' (with a space). parseItemRarity normalizes both forms.
  private extractRarity(raw: FoundryItem): ItemRarity | null {
    const rarityRaw = raw.system.rarity;
    if (typeof rarityRaw !== 'string' || rarityRaw === '') {
      return null;
    }
    try {
      return parseItemRarity(rarityRaw);
    } catch {
      return null;
    }
  }

  private extractIdentified(raw: FoundryItem): boolean | null {
    const identifiedRaw = raw.system.identified;
    if (typeof identifiedRaw !== 'boolean') {
      return null;
    }
    return identifiedRaw;
  }

  // FOUNDRY-specific edge case: attunement schema mutates between dnd5e
  // versions. We accept all three known shapes:
  //   - string  ('none' | 'required' | 'attuned')
  //   - number  (0 = none, 1 = required, 2 = attuned)
  //   - object  ({ required: boolean })
  // Returns null when none of the recognized shapes apply.
  private extractRequiresAttunement(raw: FoundryItem): boolean | null {
    const attunement: FoundryAttunementField | undefined = raw.system.attunement;
    if (attunement === undefined) {
      return null;
    }
    if (typeof attunement === 'boolean') {
      return attunement;
    }
    if (typeof attunement === 'string') {
      const normalized = attunement.trim().toLowerCase();
      if (normalized === 'required' || normalized === 'attuned') {
        return true;
      }
      if (normalized === 'none') {
        return false;
      }
      return null;
    }
    if (typeof attunement === 'number') {
      if (!Number.isFinite(attunement)) {
        return null;
      }
      return attunement >= 1;
    }
    if (typeof attunement === 'object') {
      const required = (attunement as { required?: unknown }).required;
      if (typeof required === 'boolean') {
        return required;
      }
    }
    return null;
  }

  // Spell-specific. Returns null for non-spell items, even if a `level` field
  // is present (level on a class/feat means something else in dnd5e).
  private extractSpellLevel(raw: FoundryItem, type: ItemType): number | null {
    if (type !== ItemType.Spell) {
      return null;
    }
    const levelRaw = raw.system.level;
    if (typeof levelRaw !== 'number' || !SpellLevel.isValid(levelRaw)) {
      return null;
    }
    return levelRaw;
  }

  // FOUNDRY-specific edge case: Foundry stores schools as 3-letter codes
  // ('abj', 'evo', ...). We map them to the full-word SpellSchool enum.
  private extractSpellSchool(raw: FoundryItem, type: ItemType): SpellSchool | null {
    if (type !== ItemType.Spell) {
      return null;
    }
    const schoolRaw = raw.system.school;
    if (typeof schoolRaw !== 'string' || schoolRaw === '') {
      return null;
    }
    const normalized = schoolRaw.trim().toLowerCase();
    const fromCode = FOUNDRY_SCHOOL_CODE_TO_FULL.get(normalized);
    if (fromCode !== undefined) {
      return fromCode;
    }
    // Some systems may emit the full word directly; try parsing it.
    try {
      return parseSpellSchool(normalized);
    } catch {
      return null;
    }
  }

  // Universal — applies to every item type that may carry activities.
  // Foundry uses both Map<string, Activity> (current) and plain record
  // shapes (older). Empty in either form means "no activities".
  private extractHasActivities(raw: FoundryItem): boolean {
    const activities: FoundryActivitiesField | undefined = raw.system.activities;
    if (activities === undefined) {
      return false;
    }
    if (activities instanceof Map) {
      return activities.size > 0;
    }
    if (typeof activities === 'object') {
      return Object.keys(activities).length > 0;
    }
    return false;
  }
}
