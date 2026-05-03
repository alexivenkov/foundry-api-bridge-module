import { mapIndexEntryToCommand, getNestedValue } from '../compendiumMappers';

describe('getNestedValue', () => {
  it('returns undefined for empty path', () => {
    expect(getNestedValue({ a: 1 }, '')).toBeUndefined();
  });

  it('returns flat property when present', () => {
    expect(getNestedValue({ name: 'X' }, 'name')).toBe('X');
  });

  it('prefers literal dot-path key when present (Foundry indexed entries)', () => {
    const obj: Record<string, unknown> = { 'system.level': 3, system: { level: 99 } };
    expect(getNestedValue(obj, 'system.level')).toBe(3);
  });

  it('falls back to nested traversal when no flat key', () => {
    const obj: Record<string, unknown> = { system: { level: 3 } };
    expect(getNestedValue(obj, 'system.level')).toBe(3);
  });

  it('returns undefined when nested path missing', () => {
    expect(getNestedValue({ a: { b: 1 } }, 'a.c')).toBeUndefined();
  });

  it('returns undefined when intermediate is null', () => {
    expect(getNestedValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('returns undefined when intermediate is non-object', () => {
    expect(getNestedValue({ a: 5 }, 'a.b')).toBeUndefined();
  });

  it('handles deeply nested paths', () => {
    const obj = { a: { b: { c: { d: 'deep' } } } };
    expect(getNestedValue(obj, 'a.b.c.d')).toBe('deep');
  });
});

describe('mapIndexEntryToCommand', () => {
  it('maps full entry with all fields present', () => {
    const result = mapIndexEntryToCommand({
      _id: 'e1',
      name: 'Goblin',
      img: 'g.webp',
      type: 'npc'
    });
    expect(result).toEqual({ id: 'e1', name: 'Goblin', img: 'g.webp', type: 'npc' });
  });

  it('falls back to id when _id missing', () => {
    const result = mapIndexEntryToCommand({ id: 'e1', name: 'X' });
    expect(result.id).toBe('e1');
  });

  it('uses empty string when both _id and id missing', () => {
    const result = mapIndexEntryToCommand({ name: 'X' });
    expect(result.id).toBe('');
  });

  it('uses empty string when name missing', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1' });
    expect(result.name).toBe('');
  });

  it('returns img: null when img missing', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1', name: 'X' });
    expect(result.img).toBeNull();
  });

  it('returns img: null when img is null', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1', name: 'X', img: null });
    expect(result.img).toBeNull();
  });

  it('returns type: null when type missing', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1', name: 'X' });
    expect(result.type).toBeNull();
  });

  it('returns type: null when type is null', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1', name: 'X', type: null });
    expect(result.type).toBeNull();
  });

  it('omits fields when no requestedFields', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1', name: 'X' });
    expect(result).not.toHaveProperty('fields');
  });

  it('omits fields when requestedFields is empty', () => {
    const result = mapIndexEntryToCommand({ _id: 'e1', name: 'X' }, []);
    expect(result).not.toHaveProperty('fields');
  });

  it('populates fields when requestedFields provided', () => {
    const result = mapIndexEntryToCommand(
      { _id: 'e1', name: 'X', 'system.level': 3 },
      ['system.level']
    );
    expect(result.fields).toEqual({ 'system.level': 3 });
  });

  it('field value is undefined when path not found', () => {
    const result = mapIndexEntryToCommand(
      { _id: 'e1', name: 'X' },
      ['system.missing']
    );
    expect(result.fields).toEqual({ 'system.missing': undefined });
  });
});
