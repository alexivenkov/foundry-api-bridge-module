import { ValidationError } from '@/filtering/shared/domain/errors';
import { ActorType, parseActorType } from '../ActorType';

describe('ActorType', () => {
  describe('enum values', () => {
    it('exposes all four D&D 5e actor types', () => {
      expect(ActorType.Character).toBe('character');
      expect(ActorType.Npc).toBe('npc');
      expect(ActorType.Vehicle).toBe('vehicle');
      expect(ActorType.Group).toBe('group');
    });
  });

  describe('parseActorType', () => {
    it('parses lowercase character', () => {
      expect(parseActorType('character')).toBe(ActorType.Character);
    });

    it('parses uppercase character', () => {
      expect(parseActorType('CHARACTER')).toBe(ActorType.Character);
    });

    it('parses mixed-case character', () => {
      expect(parseActorType('Character')).toBe(ActorType.Character);
    });

    it('parses npc (all cases)', () => {
      expect(parseActorType('npc')).toBe(ActorType.Npc);
      expect(parseActorType('NPC')).toBe(ActorType.Npc);
      expect(parseActorType('Npc')).toBe(ActorType.Npc);
    });

    it('parses vehicle (all cases)', () => {
      expect(parseActorType('vehicle')).toBe(ActorType.Vehicle);
      expect(parseActorType('VEHICLE')).toBe(ActorType.Vehicle);
      expect(parseActorType('Vehicle')).toBe(ActorType.Vehicle);
    });

    it('parses group (all cases)', () => {
      expect(parseActorType('group')).toBe(ActorType.Group);
      expect(parseActorType('GROUP')).toBe(ActorType.Group);
      expect(parseActorType('Group')).toBe(ActorType.Group);
    });

    it('trims surrounding whitespace before parsing', () => {
      expect(parseActorType('  character  ')).toBe(ActorType.Character);
    });

    it('throws ValidationError for unknown value', () => {
      expect(() => parseActorType('unknown')).toThrow(ValidationError);
    });

    it('error message includes original raw input', () => {
      expect(() => parseActorType('unknown')).toThrow("unknown actorType: 'unknown'");
    });

    it('throws ValidationError for empty string', () => {
      expect(() => parseActorType('')).toThrow(ValidationError);
    });

    it('throws ValidationError for whitespace-only string', () => {
      expect(() => parseActorType('   ')).toThrow(ValidationError);
    });

    it('throws ValidationError for numeric-looking string', () => {
      expect(() => parseActorType('123')).toThrow(ValidationError);
    });
  });
});
