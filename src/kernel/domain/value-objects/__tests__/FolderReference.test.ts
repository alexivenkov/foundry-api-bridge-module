import { ValidationError } from '@/kernel/domain/errors';
import { FolderReference } from '../FolderReference';

describe('FolderReference', () => {
  describe('construction — invariants', () => {
    it('throws when both id and name are undefined', () => {
      expect(() => new FolderReference(undefined, undefined, false)).toThrow(ValidationError);
    });

    it('throws with message indicating "id" or "name" required', () => {
      expect(() => new FolderReference(undefined, undefined, true)).toThrow(
        "folder must specify at least 'id' or 'name'"
      );
    });

    it('throws on empty-string id', () => {
      expect(() => new FolderReference('', 'Forest', false)).toThrow(ValidationError);
    });

    it('throws on empty-string name', () => {
      expect(() => new FolderReference('folder-1', '', false)).toThrow(ValidationError);
    });

    it('throws on whitespace-only id', () => {
      expect(() => new FolderReference('   ', undefined, false)).toThrow(ValidationError);
    });

    it('throws on whitespace-only name', () => {
      expect(() => new FolderReference(undefined, '   ', false)).toThrow(ValidationError);
    });
  });

  describe('construction — happy paths', () => {
    it('accepts id only', () => {
      const ref = new FolderReference('folder-1', undefined, false);
      expect(ref.id).toBe('folder-1');
      expect(ref.name).toBeUndefined();
      expect(ref.recursive).toBe(false);
    });

    it('accepts name only', () => {
      const ref = new FolderReference(undefined, 'NPCs', true);
      expect(ref.id).toBeUndefined();
      expect(ref.name).toBe('NPCs');
      expect(ref.recursive).toBe(true);
    });

    it('accepts both id and name (resolver decides precedence)', () => {
      const ref = new FolderReference('folder-1', 'NPCs', false);
      expect(ref.id).toBe('folder-1');
      expect(ref.name).toBe('NPCs');
    });

    it('preserves recursive=true', () => {
      const ref = new FolderReference('folder-1', undefined, true);
      expect(ref.recursive).toBe(true);
    });

    it('preserves recursive=false', () => {
      const ref = new FolderReference('folder-1', undefined, false);
      expect(ref.recursive).toBe(false);
    });

    it('preserves leading/trailing whitespace in non-empty id (caller decides normalization)', () => {
      const ref = new FolderReference(' folder-1 ', undefined, false);
      expect(ref.id).toBe(' folder-1 ');
    });

    it('preserves leading/trailing whitespace in non-empty name', () => {
      const ref = new FolderReference(undefined, ' NPCs ', false);
      expect(ref.name).toBe(' NPCs ');
    });
  });

  describe('immutability', () => {
    it('exposes id, name, and recursive as readonly fields', () => {
      const ref = new FolderReference('folder-1', 'NPCs', true);
      // Type-level readonly is enforced by TS; here we sanity-check the values
      // are simple primitives stored as own properties.
      expect(ref.id).toBe('folder-1');
      expect(ref.name).toBe('NPCs');
      expect(ref.recursive).toBe(true);
    });
  });
});
