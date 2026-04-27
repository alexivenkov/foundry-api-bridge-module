import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { HasPlayerOwnerSpecification } from '../HasPlayerOwnerSpecification';

describe('HasPlayerOwnerSpecification', () => {
  describe('expected = true', () => {
    const spec = new HasPlayerOwnerSpecification(true);

    it('matches PCs (GANDALF, FRODO)', () => {
      expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
      expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    });

    it('matches the player-owned PARTY_GROUP', () => {
      expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(true);
    });

    it('rejects NPCs and vehicles', () => {
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
      expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
      expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    });
  });

  describe('expected = false', () => {
    const spec = new HasPlayerOwnerSpecification(false);

    it('matches NPCs and vehicles', () => {
      expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
      expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(true);
      expect(spec.isSatisfiedBy(WAGON)).toBe(true);
    });

    it('rejects PCs and the player-owned group', () => {
      expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
      expect(spec.isSatisfiedBy(FRODO)).toBe(false);
      expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
    });
  });
});
