import { getNestedValue, toPackIndexEntry } from '../indexEntryMapper';

describe('getNestedValue', () => {
  it('returns undefined for empty path', () => {
    expect(getNestedValue({ a: 1 }, '')).toBeUndefined();
  });

  it('returns flat property when present', () => {
    expect(getNestedValue({ a: 1 }, 'a')).toBe(1);
  });

  it('prefers literal dot-path key when present (Foundry indexed entries)', () => {
    const obj = { 'system.level': 5, system: { level: 9 } };
    expect(getNestedValue(obj, 'system.level')).toBe(5);
  });

  it('falls back to nested traversal when no flat key', () => {
    expect(getNestedValue({ system: { level: 9 } }, 'system.level')).toBe(9);
  });

  it('returns undefined when nested path missing', () => {
    expect(getNestedValue({ system: {} }, 'system.level.value')).toBeUndefined();
  });

  it('returns undefined when intermediate is null', () => {
    expect(getNestedValue({ system: null }, 'system.level')).toBeUndefined();
  });

  it('returns undefined when intermediate is non-object', () => {
    expect(getNestedValue({ system: 42 }, 'system.level')).toBeUndefined();
  });

  it('handles deeply nested paths', () => {
    const obj = { a: { b: { c: { d: 'deep' } } } };
    expect(getNestedValue(obj, 'a.b.c.d')).toBe('deep');
  });
});

describe('toPackIndexEntry', () => {
  it('maps full entry with all fields present', () => {
    expect(
      toPackIndexEntry({ _id: 'x1', name: 'Goblin', img: 'g.png', type: 'npc' })
    ).toEqual({ id: 'x1', name: 'Goblin', img: 'g.png', type: 'npc' });
  });

  it('falls back to id when _id missing', () => {
    expect(toPackIndexEntry({ id: 'x2', name: 'A' }).id).toBe('x2');
  });

  it('uses empty string when both _id and id missing', () => {
    expect(toPackIndexEntry({ name: 'A' }).id).toBe('');
  });

  it('uses empty string when name missing', () => {
    expect(toPackIndexEntry({ _id: 'x' }).name).toBe('');
  });

  it('returns img: null when img missing or null', () => {
    expect(toPackIndexEntry({ _id: 'x' }).img).toBeNull();
    expect(toPackIndexEntry({ _id: 'x', img: null }).img).toBeNull();
  });

  it('returns type: null when type missing or null', () => {
    expect(toPackIndexEntry({ _id: 'x' }).type).toBeNull();
    expect(toPackIndexEntry({ _id: 'x', type: null }).type).toBeNull();
  });

  it('keeps empty-string type as empty string (not null)', () => {
    expect(toPackIndexEntry({ _id: 'x', type: '' }).type).toBe('');
  });

  it('omits fields when no requestedFields or empty list', () => {
    expect(toPackIndexEntry({ _id: 'x' })).not.toHaveProperty('fields');
    expect(toPackIndexEntry({ _id: 'x' }, [])).not.toHaveProperty('fields');
  });

  it('populates fields when requestedFields provided', () => {
    const entry = toPackIndexEntry(
      { _id: 'x', name: 'A', system: { level: 3 } },
      ['system.level']
    );
    expect(entry.fields).toEqual({ 'system.level': 3 });
  });

  it('keeps unresolved field paths as explicit undefined values', () => {
    const entry = toPackIndexEntry({ _id: 'x' }, ['system.missing']);
    expect(entry.fields).toHaveProperty(['system.missing']);
    expect(entry.fields?.['system.missing']).toBeUndefined();
  });
});
