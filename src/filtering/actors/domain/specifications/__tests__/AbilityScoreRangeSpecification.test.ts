import { Range } from '@/kernel/domain/value-objects';
import { ValidationError } from '@/kernel/domain/errors';
import { AbilityKey } from '@/filtering/actors/domain/value-objects';
import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { AbilityScoreRangeSpecification } from '../AbilityScoreRangeSpecification';

describe('AbilityScoreRangeSpecification', () => {
  describe('construction', () => {
    it('throws ValidationError on empty map', () => {
      expect(() => new AbilityScoreRangeSpecification({})).toThrow(ValidationError);
    });

    it('error message mentions at-least-one requirement', () => {
      expect(() => new AbilityScoreRangeSpecification({})).toThrow(
        /at least one ability range/i
      );
    });
  });

  describe('single-ability ranges', () => {
    it('{ str: Range(15,_) } matches DRAGON (str=30), excludes GANDALF (str=10)', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(15, undefined)
      });
      expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    });

    it('{ str: Range(20,_) } matches DRAGON only — excludes all PCs/NPCs with lower str', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(20, undefined)
      });
      expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
      expect(spec.isSatisfiedBy(FRODO)).toBe(false);
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    });

    it('{ int: Range(20,_) } matches GANDALF (int=22), excludes GOBLIN (int=10)', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Int]: new Range(20, undefined)
      });
      expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    });

    it('{ cha: Range(_, 10) } matches low-charisma actors (GOBLIN cha=8)', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Cha]: new Range(undefined, 10)
      });
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    });
  });

  describe('multi-ability ranges (AND inside)', () => {
    it('{ str:[8,10], dex:[15,18] } — only FRODO matches (str=10, dex=16)', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(8, 10),
        [AbilityKey.Dex]: new Range(15, 18)
      });
      expect(spec.isSatisfiedBy(FRODO)).toBe(true);
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
      expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
    });

    it('all-three: { str:[20,_], con:[20,_], cha:[20,_] } — only DRAGON', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(20, undefined),
        [AbilityKey.Con]: new Range(20, undefined),
        [AbilityKey.Cha]: new Range(20, undefined)
      });
      expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    });

    it('one ability fails — overall false (AND semantics)', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(8, 12),
        [AbilityKey.Int]: new Range(25, undefined)
      });
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
      expect(spec.isSatisfiedBy(FRODO)).toBe(false);
    });
  });

  describe('silent exclude on null abilities', () => {
    it('WAGON (abilities=null) → false', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(0, 30)
      });
      expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    });

    it('PARTY_GROUP (abilities=null) → false', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(0, 30)
      });
      expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
    });

    it('multi-key spec also silently excludes null-abilities actors', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(0, 30),
        [AbilityKey.Dex]: new Range(0, 30)
      });
      expect(spec.isSatisfiedBy(WAGON)).toBe(false);
      expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
    });
  });

  describe('boundary inclusion', () => {
    it('exact match — { str: Range(10, 10) } matches GANDALF and FRODO', () => {
      const spec = new AbilityScoreRangeSpecification({
        [AbilityKey.Str]: new Range(10, 10)
      });
      expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
      expect(spec.isSatisfiedBy(FRODO)).toBe(true);
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    });
  });
});
