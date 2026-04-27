import {
  ABILITY_KEYS,
  ActorType,
  CreatureType,
  Disposition,
  Size
} from '@/filtering/actors/domain/value-objects';

import { FoundryActorMapper } from '../FoundryActorMapper';
import {
  FOUNDRY_DISPOSITIONS,
  type FoundryActor,
  type FoundryActorAbilities,
  type FoundryActorAttributes,
  type FoundryActorDetails,
  type FoundryActorSystem,
  type FoundryActorTraits,
  type FoundryFolder,
  type FoundryPrototypeToken
} from '../foundryActorTypes';

interface MockFoundryActorOverrides {
  id?: string;
  name?: string;
  type?: string;
  hasPlayerOwner?: boolean;
  folder?: FoundryFolder | null;
  system?: FoundryActorSystem;
  prototypeToken?: FoundryPrototypeToken;
  // when true, builds the actor WITHOUT a prototypeToken property
  noPrototypeToken?: boolean;
}

function fullSystem(): FoundryActorSystem {
  const details: FoundryActorDetails = {
    cr: { value: 17 },
    level: 5,
    type: { value: 'humanoid' }
  };
  const traits: FoundryActorTraits = { size: 'med' };
  const attributes: FoundryActorAttributes = {
    hp: { value: 50, max: 80 },
    ac: { value: 16 }
  };
  const abilities: FoundryActorAbilities = {
    str: { value: 12 },
    dex: { value: 14 },
    con: { value: 13 },
    int: { value: 18 },
    wis: { value: 16 },
    cha: { value: 10 }
  };
  return { details, traits, attributes, abilities };
}

function createMockFoundryActor(overrides: MockFoundryActorOverrides = {}): FoundryActor {
  const result: FoundryActor = {
    id: overrides.id ?? 'a1',
    name: overrides.name ?? 'Test Actor',
    type: overrides.type ?? 'character',
    hasPlayerOwner: overrides.hasPlayerOwner ?? true,
    folder: overrides.folder !== undefined ? overrides.folder : { id: 'folder-pcs' },
    system: overrides.system ?? fullSystem()
  };
  if (overrides.noPrototypeToken === true) {
    return result;
  }
  return {
    ...result,
    prototypeToken: overrides.prototypeToken ?? {
      disposition: FOUNDRY_DISPOSITIONS.FRIENDLY
    }
  };
}

describe('FoundryActorMapper', () => {
  let mapper: FoundryActorMapper;

  beforeEach(() => {
    mapper = new FoundryActorMapper();
  });

  describe('full snapshot mapping', () => {
    it('maps a complete actor to a complete ActorSnapshot', () => {
      const raw = createMockFoundryActor();

      const snapshot = mapper.toSnapshot(raw);

      expect(snapshot).toEqual({
        id: 'a1',
        name: 'Test Actor',
        type: ActorType.Character,
        hasPlayerOwner: true,
        folderId: 'folder-pcs',
        creatureType: CreatureType.Humanoid,
        size: Size.Medium,
        disposition: Disposition.Friendly,
        cr: 17,
        level: 5,
        hp: { current: 50, max: 80 },
        ac: 16,
        abilities: { str: 12, dex: 14, con: 13, int: 18, wis: 16, cha: 10 }
      });
    });
  });

  describe('basic identity fields', () => {
    it('passes through id, name, hasPlayerOwner', () => {
      const raw = createMockFoundryActor({
        id: 'xyz-42',
        name: 'Hero',
        hasPlayerOwner: false
      });

      const snapshot = mapper.toSnapshot(raw);

      expect(snapshot.id).toBe('xyz-42');
      expect(snapshot.name).toBe('Hero');
      expect(snapshot.hasPlayerOwner).toBe(false);
    });
  });

  describe('actor type', () => {
    it('parses character', () => {
      const raw = createMockFoundryActor({ type: 'character' });
      expect(mapper.toSnapshot(raw).type).toBe(ActorType.Character);
    });

    it('parses npc', () => {
      const raw = createMockFoundryActor({ type: 'npc' });
      expect(mapper.toSnapshot(raw).type).toBe(ActorType.Npc);
    });

    it('parses vehicle', () => {
      const raw = createMockFoundryActor({ type: 'vehicle' });
      expect(mapper.toSnapshot(raw).type).toBe(ActorType.Vehicle);
    });

    it('parses group', () => {
      const raw = createMockFoundryActor({ type: 'group' });
      expect(mapper.toSnapshot(raw).type).toBe(ActorType.Group);
    });

    it('falls back to Npc for unknown actor types', () => {
      const raw = createMockFoundryActor({ type: 'custom-system-type' });
      expect(mapper.toSnapshot(raw).type).toBe(ActorType.Npc);
    });
  });

  describe('folderId', () => {
    it('extracts folder.id when folder is present', () => {
      const raw = createMockFoundryActor({ folder: { id: 'folder-xyz' } });
      expect(mapper.toSnapshot(raw).folderId).toBe('folder-xyz');
    });

    it('returns null when folder is null', () => {
      const raw = createMockFoundryActor({ folder: null });
      expect(mapper.toSnapshot(raw).folderId).toBeNull();
    });
  });

  describe('creatureType extraction', () => {
    it('reads creatureType from object form { value: ... }', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, type: { value: 'dragon' } } }
      });
      expect(mapper.toSnapshot(raw).creatureType).toBe(CreatureType.Dragon);
    });

    it('reads creatureType from plain string form (legacy)', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, type: 'beast' } }
      });
      expect(mapper.toSnapshot(raw).creatureType).toBe(CreatureType.Beast);
    });

    it('returns null when details.type is undefined', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { cr: 1, level: 1 } }
      });
      expect(mapper.toSnapshot(raw).creatureType).toBeNull();
    });

    it('returns null when details.type is empty string', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, type: '' } }
      });
      expect(mapper.toSnapshot(raw).creatureType).toBeNull();
    });

    it('returns null when details.type.value is undefined', () => {
      // At runtime Foundry can serialize { value: undefined }; bypass TS to simulate.
      const typeWithUndefined = { value: undefined } as unknown as { value: string };
      const raw = createMockFoundryActor({
        system: {
          ...fullSystem(),
          details: { ...fullSystem().details, type: typeWithUndefined }
        }
      });
      expect(mapper.toSnapshot(raw).creatureType).toBeNull();
    });

    it('returns null for unknown creature type (silent fallback)', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, type: 'demon' } }
      });
      expect(mapper.toSnapshot(raw).creatureType).toBeNull();
    });

    it('returns null when system.details is undefined', () => {
      const raw = createMockFoundryActor({ system: {} });
      expect(mapper.toSnapshot(raw).creatureType).toBeNull();
    });
  });

  describe('size extraction', () => {
    it('parses known size strings', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), traits: { size: 'huge' } }
      });
      expect(mapper.toSnapshot(raw).size).toBe(Size.Huge);
    });

    it('returns null when traits.size is undefined', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), traits: {} }
      });
      expect(mapper.toSnapshot(raw).size).toBeNull();
    });

    it('returns null when system.traits is missing', () => {
      const raw = createMockFoundryActor({ system: {} });
      expect(mapper.toSnapshot(raw).size).toBeNull();
    });

    it('returns null for unknown size value', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), traits: { size: 'small' } }
      });
      expect(mapper.toSnapshot(raw).size).toBeNull();
    });
  });

  describe('disposition extraction', () => {
    it('maps HOSTILE (-1) to Disposition.Hostile', () => {
      const raw = createMockFoundryActor({
        prototypeToken: { disposition: FOUNDRY_DISPOSITIONS.HOSTILE }
      });
      expect(mapper.toSnapshot(raw).disposition).toBe(Disposition.Hostile);
    });

    it('maps NEUTRAL (0) to Disposition.Neutral', () => {
      const raw = createMockFoundryActor({
        prototypeToken: { disposition: FOUNDRY_DISPOSITIONS.NEUTRAL }
      });
      expect(mapper.toSnapshot(raw).disposition).toBe(Disposition.Neutral);
    });

    it('maps FRIENDLY (1) to Disposition.Friendly', () => {
      const raw = createMockFoundryActor({
        prototypeToken: { disposition: FOUNDRY_DISPOSITIONS.FRIENDLY }
      });
      expect(mapper.toSnapshot(raw).disposition).toBe(Disposition.Friendly);
    });

    it('maps SECRET (-2) to Disposition.Secret', () => {
      const raw = createMockFoundryActor({
        prototypeToken: { disposition: FOUNDRY_DISPOSITIONS.SECRET }
      });
      expect(mapper.toSnapshot(raw).disposition).toBe(Disposition.Secret);
    });

    it('returns null when prototypeToken is undefined', () => {
      const raw = createMockFoundryActor({ noPrototypeToken: true });
      expect(mapper.toSnapshot(raw).disposition).toBeNull();
    });

    it('returns null when prototypeToken.disposition is undefined', () => {
      const raw = createMockFoundryActor({ prototypeToken: {} });
      expect(mapper.toSnapshot(raw).disposition).toBeNull();
    });

    it('returns null for unknown disposition number', () => {
      const raw = createMockFoundryActor({ prototypeToken: { disposition: 5 } });
      expect(mapper.toSnapshot(raw).disposition).toBeNull();
    });
  });

  describe('cr extraction', () => {
    it('extracts cr from number form (legacy)', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, cr: 7 } }
      });
      expect(mapper.toSnapshot(raw).cr).toBe(7);
    });

    it('extracts cr from object form { value: 0.25 } (fractional)', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, cr: { value: 0.25 } } }
      });
      expect(mapper.toSnapshot(raw).cr).toBe(0.25);
    });

    it('returns null when cr is undefined', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, cr: undefined } }
      });
      expect(mapper.toSnapshot(raw).cr).toBeNull();
    });

    it('returns null when cr.value is non-finite (NaN)', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, cr: { value: NaN } } }
      });
      expect(mapper.toSnapshot(raw).cr).toBeNull();
    });

    it('returns null when cr is infinite number', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), details: { ...fullSystem().details, cr: Infinity } }
      });
      expect(mapper.toSnapshot(raw).cr).toBeNull();
    });

    it('returns null when system.details is missing', () => {
      const raw = createMockFoundryActor({ system: {} });
      expect(mapper.toSnapshot(raw).cr).toBeNull();
    });

    it('returns null when cr object lacks value field', () => {
      const raw = createMockFoundryActor({
        system: {
          ...fullSystem(),
          details: { ...fullSystem().details, cr: {} as { value: number } }
        }
      });
      expect(mapper.toSnapshot(raw).cr).toBeNull();
    });
  });

  describe('level extraction', () => {
    it('extracts details.level for character types', () => {
      const raw = createMockFoundryActor({
        type: 'character',
        system: { ...fullSystem(), details: { ...fullSystem().details, level: 11 } }
      });
      expect(mapper.toSnapshot(raw).level).toBe(11);
    });

    it('falls back to attributes.level when details.level is missing', () => {
      const detailsNoLevel = { ...fullSystem().details };
      delete detailsNoLevel.level;
      const raw = createMockFoundryActor({
        type: 'character',
        system: {
          ...fullSystem(),
          details: detailsNoLevel,
          attributes: { ...fullSystem().attributes, level: 8 }
        }
      });
      expect(mapper.toSnapshot(raw).level).toBe(8);
    });

    it('returns null for non-character actor types (e.g. npc)', () => {
      const raw = createMockFoundryActor({
        type: 'npc',
        system: { ...fullSystem(), details: { ...fullSystem().details, level: 9 } }
      });
      expect(mapper.toSnapshot(raw).level).toBeNull();
    });

    it('returns null when level is missing', () => {
      const detailsNoLevel = { ...fullSystem().details };
      delete detailsNoLevel.level;
      const raw = createMockFoundryActor({
        type: 'character',
        system: { ...fullSystem(), details: detailsNoLevel }
      });
      expect(mapper.toSnapshot(raw).level).toBeNull();
    });

    it('returns null when level is non-finite', () => {
      const raw = createMockFoundryActor({
        type: 'character',
        system: { ...fullSystem(), details: { ...fullSystem().details, level: NaN } }
      });
      expect(mapper.toSnapshot(raw).level).toBeNull();
    });
  });

  describe('hp extraction', () => {
    it('extracts both current and max', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { hp: { value: 25, max: 50 } } }
      });
      expect(mapper.toSnapshot(raw).hp).toEqual({ current: 25, max: 50 });
    });

    it('returns null when hp is missing', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: {} }
      });
      expect(mapper.toSnapshot(raw).hp).toBeNull();
    });

    it('returns null when system.attributes is missing', () => {
      const raw = createMockFoundryActor({ system: {} });
      expect(mapper.toSnapshot(raw).hp).toBeNull();
    });

    it('returns null when hp.max is missing', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { hp: { value: 10 } } }
      });
      expect(mapper.toSnapshot(raw).hp).toBeNull();
    });

    it('returns null when hp.value is missing', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { hp: { max: 50 } } }
      });
      expect(mapper.toSnapshot(raw).hp).toBeNull();
    });

    it('returns null when hp.value is non-finite', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { hp: { value: NaN, max: 50 } } }
      });
      expect(mapper.toSnapshot(raw).hp).toBeNull();
    });

    it('returns null when hp.max is non-finite', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { hp: { value: 10, max: Infinity } } }
      });
      expect(mapper.toSnapshot(raw).hp).toBeNull();
    });
  });

  describe('ac extraction', () => {
    it('extracts ac.value', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { ac: { value: 19 } } }
      });
      expect(mapper.toSnapshot(raw).ac).toBe(19);
    });

    it('returns null when ac is missing', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: {} }
      });
      expect(mapper.toSnapshot(raw).ac).toBeNull();
    });

    it('returns null when ac.value is missing', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { ac: {} } }
      });
      expect(mapper.toSnapshot(raw).ac).toBeNull();
    });

    it('returns null when ac.value is non-finite', () => {
      const raw = createMockFoundryActor({
        system: { ...fullSystem(), attributes: { ac: { value: NaN } } }
      });
      expect(mapper.toSnapshot(raw).ac).toBeNull();
    });

    it('returns null when system.attributes is missing', () => {
      const raw = createMockFoundryActor({ system: {} });
      expect(mapper.toSnapshot(raw).ac).toBeNull();
    });
  });

  describe('abilities extraction', () => {
    it('extracts all 6 ability scores', () => {
      const raw = createMockFoundryActor();
      const snapshot = mapper.toSnapshot(raw);

      expect(snapshot.abilities).toEqual({
        str: 12,
        dex: 14,
        con: 13,
        int: 18,
        wis: 16,
        cha: 10
      });
    });

    it('returns null when abilities is missing entirely', () => {
      const sys = { ...fullSystem() };
      delete sys.abilities;
      const raw = createMockFoundryActor({ system: sys });
      expect(mapper.toSnapshot(raw).abilities).toBeNull();
    });

    it('returns null when only some abilities are present (all-or-nothing)', () => {
      const raw = createMockFoundryActor({
        system: {
          ...fullSystem(),
          abilities: {
            str: { value: 10 },
            dex: { value: 12 }
            // con/int/wis/cha missing
          }
        }
      });
      expect(mapper.toSnapshot(raw).abilities).toBeNull();
    });

    it('returns null when an ability value is non-finite', () => {
      const raw = createMockFoundryActor({
        system: {
          ...fullSystem(),
          abilities: {
            str: { value: 10 },
            dex: { value: 12 },
            con: { value: NaN },
            int: { value: 14 },
            wis: { value: 13 },
            cha: { value: 11 }
          }
        }
      });
      expect(mapper.toSnapshot(raw).abilities).toBeNull();
    });

    it('returns null when an ability is missing the value field', () => {
      const raw = createMockFoundryActor({
        system: {
          ...fullSystem(),
          abilities: {
            str: { value: 10 },
            dex: { value: 12 },
            con: {} as { value: number },
            int: { value: 14 },
            wis: { value: 13 },
            cha: { value: 11 }
          }
        }
      });
      expect(mapper.toSnapshot(raw).abilities).toBeNull();
    });

    it('preserves all 6 keys in the result', () => {
      const raw = createMockFoundryActor();
      const snapshot = mapper.toSnapshot(raw);

      expect(snapshot.abilities).not.toBeNull();
      for (const key of ABILITY_KEYS) {
        expect(snapshot.abilities).toHaveProperty(key);
      }
    });
  });

  describe('null-tolerant extraction', () => {
    it('handles a minimal actor (only id/name/type/hasPlayerOwner/folder/system) gracefully', () => {
      const raw: FoundryActor = {
        id: 'minimal',
        name: 'Bare',
        type: 'npc',
        hasPlayerOwner: false,
        folder: null,
        system: {}
      };

      const snapshot = mapper.toSnapshot(raw);

      expect(snapshot).toEqual({
        id: 'minimal',
        name: 'Bare',
        type: ActorType.Npc,
        hasPlayerOwner: false,
        folderId: null,
        creatureType: null,
        size: null,
        disposition: null,
        cr: null,
        level: null,
        hp: null,
        ac: null,
        abilities: null
      });
    });
  });
});
