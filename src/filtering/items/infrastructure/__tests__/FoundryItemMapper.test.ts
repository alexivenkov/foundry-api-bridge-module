import {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';

import { FoundryItemMapper } from '../FoundryItemMapper';
import type {
  FoundryActivitiesField,
  FoundryAttunementField,
  FoundryItem,
  FoundryItemSystem
} from '../foundryItemTypes';

interface MockItemOverrides {
  id?: string;
  name?: string;
  type?: string;
  folder?: { id: string } | null;
  system?: FoundryItemSystem;
}

function fullSystem(): FoundryItemSystem {
  return {
    rarity: 'common',
    identified: true,
    weight: 3,
    price: { value: 15, denomination: 'gp' },
    attunement: 'none',
    activities: { 'a-1': {} }
  };
}

function createMockItem(overrides: MockItemOverrides = {}): FoundryItem {
  return {
    id: overrides.id ?? 'i1',
    name: overrides.name ?? 'Test Item',
    type: overrides.type ?? 'weapon',
    folder:
      overrides.folder !== undefined ? overrides.folder : { id: 'folder-default' },
    system: overrides.system ?? fullSystem()
  };
}

describe('FoundryItemMapper', () => {
  let mapper: FoundryItemMapper;

  beforeEach(() => {
    mapper = new FoundryItemMapper();
  });

  describe('full snapshot mapping', () => {
    it('maps a complete weapon item to a complete ItemSnapshot', () => {
      const raw = createMockItem();
      const snapshot = mapper.toSnapshot(raw);

      expect(snapshot).toEqual({
        id: 'i1',
        name: 'Test Item',
        type: ItemType.Weapon,
        folderId: 'folder-default',
        rarity: ItemRarity.Common,
        identified: true,
        requiresAttunement: false,
        weight: 3,
        priceGp: 15,
        spellLevel: null,
        spellSchool: null,
        hasActivities: true,
        isContainer: false
      });
    });
  });

  describe('basic identity fields', () => {
    it('passes through id, name', () => {
      const raw = createMockItem({ id: 'xyz', name: 'Hero Sword' });
      const snapshot = mapper.toSnapshot(raw);
      expect(snapshot.id).toBe('xyz');
      expect(snapshot.name).toBe('Hero Sword');
    });
  });

  describe('item type extraction', () => {
    it('parses every documented core type', () => {
      const types: Array<[string, ItemType]> = [
        ['weapon', ItemType.Weapon],
        ['equipment', ItemType.Equipment],
        ['consumable', ItemType.Consumable],
        ['tool', ItemType.Tool],
        ['container', ItemType.Container],
        ['loot', ItemType.Loot],
        ['spell', ItemType.Spell],
        ['feat', ItemType.Feat],
        ['background', ItemType.Background],
        ['race', ItemType.Race],
        ['class', ItemType.Class],
        ['subclass', ItemType.Subclass],
        ['feature', ItemType.Feature]
      ];
      for (const [raw, expected] of types) {
        const snapshot = mapper.toSnapshot(createMockItem({ type: raw }));
        expect(snapshot.type).toBe(expected);
      }
    });

    it('falls back to Loot for unknown item types', () => {
      const raw = createMockItem({ type: 'custom-system-type' });
      expect(mapper.toSnapshot(raw).type).toBe(ItemType.Loot);
    });
  });

  describe('folderId', () => {
    it('extracts folder.id when folder is present', () => {
      const raw = createMockItem({ folder: { id: 'folder-xyz' } });
      expect(mapper.toSnapshot(raw).folderId).toBe('folder-xyz');
    });

    it('returns null when folder is null', () => {
      const raw = createMockItem({ folder: null });
      expect(mapper.toSnapshot(raw).folderId).toBeNull();
    });
  });

  describe('rarity extraction', () => {
    it('parses canonical "common"', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), rarity: 'common' }
      });
      expect(mapper.toSnapshot(raw).rarity).toBe(ItemRarity.Common);
    });

    it('parses camelCase "veryRare"', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), rarity: 'veryRare' }
      });
      expect(mapper.toSnapshot(raw).rarity).toBe(ItemRarity.VeryRare);
    });

    it('parses spaced "very rare" (older dnd5e)', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), rarity: 'very rare' }
      });
      expect(mapper.toSnapshot(raw).rarity).toBe(ItemRarity.VeryRare);
    });

    it('parses uppercase "RARE"', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), rarity: 'RARE' }
      });
      expect(mapper.toSnapshot(raw).rarity).toBe(ItemRarity.Rare);
    });

    it('returns null when rarity is missing', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), rarity: undefined }
      });
      expect(mapper.toSnapshot(raw).rarity).toBeNull();
    });

    it('returns null when rarity is empty string', () => {
      const raw = createMockItem({ system: { ...fullSystem(), rarity: '' } });
      expect(mapper.toSnapshot(raw).rarity).toBeNull();
    });

    it('returns null for unknown rarity (silent fallback)', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), rarity: 'mythic' }
      });
      expect(mapper.toSnapshot(raw).rarity).toBeNull();
    });

    it('returns null when rarity is not a string', () => {
      const raw = createMockItem({ system: { ...fullSystem(), rarity: 5 } });
      expect(mapper.toSnapshot(raw).rarity).toBeNull();
    });
  });

  describe('identified extraction', () => {
    it('passes through true', () => {
      const raw = createMockItem({ system: { ...fullSystem(), identified: true } });
      expect(mapper.toSnapshot(raw).identified).toBe(true);
    });

    it('passes through false', () => {
      const raw = createMockItem({ system: { ...fullSystem(), identified: false } });
      expect(mapper.toSnapshot(raw).identified).toBe(false);
    });

    it('returns null when missing', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), identified: undefined }
      });
      expect(mapper.toSnapshot(raw).identified).toBeNull();
    });

    it('returns null when not a boolean', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), identified: 'yes' }
      });
      expect(mapper.toSnapshot(raw).identified).toBeNull();
    });
  });

  describe('attunement extraction (3 schema variants)', () => {
    it('string "required" → true', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 'required' }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('string "attuned" → true', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 'attuned' }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('string "none" → false', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 'none' }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(false);
    });

    it('string is case-insensitive ("REQUIRED" → true)', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 'REQUIRED' }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('unrecognized string → null', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 'partial' }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBeNull();
    });

    it('number 0 → false', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 0 }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(false);
    });

    it('number 1 → true', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 1 }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('number 2 → true', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: 2 }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('non-finite number → null', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: NaN }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBeNull();
    });

    it('object { required: true } → true', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: { required: true } }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('object { required: false } → false', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: { required: false } }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(false);
    });

    it('object without required field → null', () => {
      const obj: FoundryAttunementField = {};
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: obj }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBeNull();
    });

    it('boolean true → true (explicit boolean form)', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: true }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(true);
    });

    it('boolean false → false', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), attunement: false }
      });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBe(false);
    });

    it('undefined (missing field) → null', () => {
      const sys = { ...fullSystem() };
      delete sys.attunement;
      const raw = createMockItem({ system: sys });
      expect(mapper.toSnapshot(raw).requiresAttunement).toBeNull();
    });
  });

  describe('weight extraction', () => {
    it('plain number form', () => {
      const raw = createMockItem({ system: { ...fullSystem(), weight: 5 } });
      expect(mapper.toSnapshot(raw).weight).toBe(5);
    });

    it('object form { value: 5 }', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), weight: { value: 5 } }
      });
      expect(mapper.toSnapshot(raw).weight).toBe(5);
    });

    it('object form { value: 5, units: "lb" }', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), weight: { value: 5, units: 'lb' } }
      });
      expect(mapper.toSnapshot(raw).weight).toBe(5);
    });

    it('returns null when missing', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), weight: undefined }
      });
      expect(mapper.toSnapshot(raw).weight).toBeNull();
    });

    it('returns null when invalid', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), weight: { value: 'heavy' } }
      });
      expect(mapper.toSnapshot(raw).weight).toBeNull();
    });
  });

  describe('priceGp extraction', () => {
    it('object { value: 10, denomination: "gp" } → 10', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), price: { value: 10, denomination: 'gp' } }
      });
      expect(mapper.toSnapshot(raw).priceGp).toBe(10);
    });

    it('object 1pp → 10gp', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), price: { value: 1, denomination: 'pp' } }
      });
      expect(mapper.toSnapshot(raw).priceGp).toBe(10);
    });

    it('object 100sp → 10gp', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), price: { value: 100, denomination: 'sp' } }
      });
      expect(mapper.toSnapshot(raw).priceGp).toBeCloseTo(10, 10);
    });

    it('plain number form is treated as gp', () => {
      const raw = createMockItem({ system: { ...fullSystem(), price: 25 } });
      expect(mapper.toSnapshot(raw).priceGp).toBe(25);
    });

    it('returns null when missing', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), price: undefined }
      });
      expect(mapper.toSnapshot(raw).priceGp).toBeNull();
    });

    it('returns null for unknown denomination', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), price: { value: 1, denomination: 'xx' } }
      });
      expect(mapper.toSnapshot(raw).priceGp).toBeNull();
    });
  });

  describe('spellLevel extraction (spell-only)', () => {
    it('extracts level for a spell', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 3, school: 'evo' }
      });
      expect(mapper.toSnapshot(raw).spellLevel).toBe(3);
    });

    it('extracts cantrip level 0', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 0, school: 'evo' }
      });
      expect(mapper.toSnapshot(raw).spellLevel).toBe(0);
    });

    it('returns null for non-spell items even when level is present', () => {
      // class items in dnd5e have a "level" field meaning class level.
      const raw = createMockItem({
        type: 'class',
        system: { ...fullSystem(), level: 5 }
      });
      expect(mapper.toSnapshot(raw).spellLevel).toBeNull();
    });

    it('returns null when level is missing', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: undefined }
      });
      expect(mapper.toSnapshot(raw).spellLevel).toBeNull();
    });

    it('returns null when level is out of range', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 10 }
      });
      expect(mapper.toSnapshot(raw).spellLevel).toBeNull();
    });

    it('returns null when level is fractional', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 2.5 }
      });
      expect(mapper.toSnapshot(raw).spellLevel).toBeNull();
    });
  });

  describe('spellSchool extraction (spell-only, 3-letter codes)', () => {
    it('maps "abj" → Abjuration', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: 'abj' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBe(SpellSchool.Abjuration);
    });

    it('maps "evo" → Evocation', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 3, school: 'evo' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBe(SpellSchool.Evocation);
    });

    it('maps every documented 3-letter code', () => {
      const codes: Array<[string, SpellSchool]> = [
        ['abj', SpellSchool.Abjuration],
        ['con', SpellSchool.Conjuration],
        ['div', SpellSchool.Divination],
        ['enc', SpellSchool.Enchantment],
        ['evo', SpellSchool.Evocation],
        ['ill', SpellSchool.Illusion],
        ['nec', SpellSchool.Necromancy],
        ['trs', SpellSchool.Transmutation]
      ];
      for (const [code, expected] of codes) {
        const raw = createMockItem({
          type: 'spell',
          system: { ...fullSystem(), level: 1, school: code }
        });
        expect(mapper.toSnapshot(raw).spellSchool).toBe(expected);
      }
    });

    it('is case-insensitive ("EVO" → Evocation)', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: 'EVO' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBe(SpellSchool.Evocation);
    });

    it('accepts full-word school names as fallback', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: 'evocation' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBe(SpellSchool.Evocation);
    });

    it('returns null for non-spell items', () => {
      const raw = createMockItem({
        type: 'weapon',
        system: { ...fullSystem(), school: 'evo' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBeNull();
    });

    it('returns null when school is missing on a spell', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: undefined }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBeNull();
    });

    it('returns null when school is empty string', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: '' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBeNull();
    });

    it('returns null for unknown school code', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: 'xyz' }
      });
      expect(mapper.toSnapshot(raw).spellSchool).toBeNull();
    });
  });

  describe('hasActivities extraction', () => {
    it('Map with entries → true', () => {
      const map: FoundryActivitiesField = new Map<string, unknown>([['a-1', {}]]);
      const raw = createMockItem({ system: { ...fullSystem(), activities: map } });
      expect(mapper.toSnapshot(raw).hasActivities).toBe(true);
    });

    it('empty Map → false', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), activities: new Map() }
      });
      expect(mapper.toSnapshot(raw).hasActivities).toBe(false);
    });

    it('object with keys → true', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), activities: { 'a-1': {} } }
      });
      expect(mapper.toSnapshot(raw).hasActivities).toBe(true);
    });

    it('empty object → false', () => {
      const raw = createMockItem({
        system: { ...fullSystem(), activities: {} }
      });
      expect(mapper.toSnapshot(raw).hasActivities).toBe(false);
    });

    it('missing → false', () => {
      const sys = { ...fullSystem() };
      delete sys.activities;
      const raw = createMockItem({ system: sys });
      expect(mapper.toSnapshot(raw).hasActivities).toBe(false);
    });

    it('defensive: non-object/non-Map activities (runtime garbage) → false', () => {
      // The TS contract says `activities` is Map | Record, but Foundry data
      // can arrive corrupted from migration / module conflict. Cast through
      // unknown to exercise the defensive `return false` branch.
      const sys = { ...fullSystem() } as { activities: unknown };
      sys.activities = 'unexpected-string';
      const raw = createMockItem({ system: sys as FoundryItemSystem });
      expect(mapper.toSnapshot(raw).hasActivities).toBe(false);
    });
  });

  describe('isContainer extraction', () => {
    it('returns true when type === container', () => {
      const raw = createMockItem({ type: 'container' });
      expect(mapper.toSnapshot(raw).isContainer).toBe(true);
    });

    it('returns false for weapons', () => {
      const raw = createMockItem({ type: 'weapon' });
      expect(mapper.toSnapshot(raw).isContainer).toBe(false);
    });

    it('returns false for spells', () => {
      const raw = createMockItem({
        type: 'spell',
        system: { ...fullSystem(), level: 1, school: 'evo' }
      });
      expect(mapper.toSnapshot(raw).isContainer).toBe(false);
    });
  });

  describe('null-tolerant extraction', () => {
    it('handles a minimal item gracefully', () => {
      const raw: FoundryItem = {
        id: 'minimal',
        name: 'Bare',
        type: 'loot',
        folder: null,
        system: {}
      };
      const snapshot = mapper.toSnapshot(raw);
      expect(snapshot).toEqual({
        id: 'minimal',
        name: 'Bare',
        type: ItemType.Loot,
        folderId: null,
        rarity: null,
        identified: null,
        requiresAttunement: null,
        weight: null,
        priceGp: null,
        spellLevel: null,
        spellSchool: null,
        hasActivities: false,
        isContainer: false
      });
    });
  });
});
