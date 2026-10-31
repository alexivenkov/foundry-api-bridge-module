import { serializeMacroResult, MACRO_RESULT_MAX_BYTES } from '../serializeMacroResult';

function documentLike(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    documentName: 'Actor',
    id: 'a1',
    uuid: 'Actor.a1',
    name: 'Bob',
    system: { attributes: { hp: { value: 10 } } },
    toJSON: jest.fn(() => ({ full: 'source' })),
    ...overrides
  };
}

function nest(levels: number): Record<string, unknown> {
  let value: Record<string, unknown> = {};
  for (let i = 1; i < levels; i++) {
    value = { a: value };
  }
  return value;
}

function innermost(value: unknown, levels: number): unknown {
  let current: unknown = value;
  for (let i = 1; i < levels; i++) {
    current = (current as { a: unknown }).a;
  }
  return current;
}

describe('serializeMacroResult', () => {
  describe('dropped values', () => {
    it('returns {} for an undefined root', () => {
      expect(serializeMacroResult(undefined)).toEqual({});
    });

    it('returns {} for a function or a symbol at the root', () => {
      expect(serializeMacroResult(() => 1)).toEqual({});
      expect(serializeMacroResult(Symbol('x'))).toEqual({});
    });

    it('omits undefined, functions and symbols from objects', () => {
      const result = serializeMacroResult({ keep: 1, u: undefined, f: () => 1, s: Symbol('x') });
      expect(result).toEqual({ result: { keep: 1 } });
      expect(Object.keys(result.result as object)).toEqual(['keep']);
    });

    it('turns undefined, functions and symbols inside arrays into null', () => {
      expect(serializeMacroResult([1, undefined, () => 1, Symbol('x'), 'z']))
        .toEqual({ result: [1, null, null, null, 'z'] });
    });
  });

  describe('primitives', () => {
    it.each([
      ['null', null],
      ['true', true],
      ['false', false],
      ['a string', 'hello'],
      ['an empty string', ''],
      ['zero', 0],
      ['a negative number', -7.5],
      ['a large number', 1e300]
    ])('keeps %s as is', (_label, value) => {
      expect(serializeMacroResult(value)).toEqual({ result: value });
    });

    it.each([
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
      ['-Infinity', Number.NEGATIVE_INFINITY]
    ])('turns %s into null', (_label, value) => {
      expect(serializeMacroResult(value)).toEqual({ result: null });
      expect(serializeMacroResult({ n: value })).toEqual({ result: { n: null } });
    });

    it('turns a bigint into its decimal string', () => {
      expect(serializeMacroResult(12345678901234567890n)).toEqual({ result: '12345678901234567890' });
      expect(serializeMacroResult({ big: -5n })).toEqual({ result: { big: '-5' } });
    });
  });

  describe('well-known objects', () => {
    it('turns a Date into its ISO string', () => {
      const date = new Date('2026-10-30T12:34:56.789Z');
      expect(serializeMacroResult(date)).toEqual({ result: '2026-10-30T12:34:56.789Z' });
    });

    it('turns an invalid Date into null', () => {
      expect(serializeMacroResult(new Date('garbage'))).toEqual({ result: null });
    });

    it('reduces an Error to its name and message', () => {
      const error = new TypeError('bad input');
      expect(serializeMacroResult(error)).toEqual({ result: { name: 'TypeError', message: 'bad input' } });
      expect(Object.keys(serializeMacroResult(error).result as object)).toEqual(['name', 'message']);
    });
  });

  describe('Foundry Documents', () => {
    it('reduces a Document-like value to its reference and never descends', () => {
      const doc = documentLike();
      expect(serializeMacroResult(doc)).toEqual({
        result: { documentName: 'Actor', id: 'a1', uuid: 'Actor.a1', name: 'Bob' }
      });
      expect(doc['toJSON']).not.toHaveBeenCalled();
    });

    it('omits name when it is not a string and uses null for a non-string id', () => {
      const doc = documentLike({ name: undefined, id: null });
      expect(serializeMacroResult(doc)).toEqual({
        result: { documentName: 'Actor', id: null, uuid: 'Actor.a1' }
      });
      expect(Object.keys(serializeMacroResult(doc).result as object)).toEqual(['documentName', 'id', 'uuid']);
    });

    it('reduces a Document nested inside a plain object', () => {
      const target = documentLike({ documentName: 'Token', id: 't1', uuid: 'Scene.s1.Token.t1', name: 'Goblin' });
      expect(serializeMacroResult({ hit: true, target, damage: [7] })).toEqual({
        result: {
          hit: true,
          target: { documentName: 'Token', id: 't1', uuid: 'Scene.s1.Token.t1', name: 'Goblin' },
          damage: [7]
        }
      });
    });

    it('takes the Document rule over toJSON', () => {
      const doc = documentLike();
      serializeMacroResult({ doc });
      expect(doc['toJSON']).not.toHaveBeenCalled();
    });

    it('does not treat an object with only one of documentName / uuid as a Document', () => {
      expect(serializeMacroResult({ documentName: 'Actor', data: 1 })).toEqual({
        result: { documentName: 'Actor', data: 1 }
      });
      expect(serializeMacroResult({ uuid: 'Actor.a1', data: 1 })).toEqual({
        result: { uuid: 'Actor.a1', data: 1 }
      });
    });
  });

  describe('collections', () => {
    it('turns a Map into an array of its converted values', () => {
      const map = new Map<string, unknown>([['a', 1], ['b', { x: undefined, y: 2 }]]);
      expect(serializeMacroResult(map)).toEqual({ result: [1, { y: 2 }] });
    });

    it('turns a Collection-like Map of Document-likes into an array of references', () => {
      class Collection<V> extends Map<string, V> {
        get contents(): V[] {
          return Array.from(this.values());
        }
      }
      const collection = new Collection<Record<string, unknown>>();
      collection.set('a1', documentLike());
      collection.set('a2', documentLike({ id: 'a2', uuid: 'Actor.a2', name: 'Alice' }));

      expect(serializeMacroResult(collection)).toEqual({
        result: [
          { documentName: 'Actor', id: 'a1', uuid: 'Actor.a1', name: 'Bob' },
          { documentName: 'Actor', id: 'a2', uuid: 'Actor.a2', name: 'Alice' }
        ]
      });
    });

    it('turns a Set into an array of its converted values', () => {
      expect(serializeMacroResult(new Set([1, 'two', Number.NaN]))).toEqual({ result: [1, 'two', null] });
    });
  });

  describe('toJSON', () => {
    it('uses toJSON for any other object and converts its result recursively', () => {
      const roll = {
        total: 7,
        _evaluated: true,
        toJSON: () => ({ class: 'Roll', formula: '1d8', total: 7, terms: [documentLike()], evaluated: true })
      };
      expect(serializeMacroResult(roll)).toEqual({
        result: {
          class: 'Roll',
          formula: '1d8',
          total: 7,
          terms: [{ documentName: 'Actor', id: 'a1', uuid: 'Actor.a1', name: 'Bob' }],
          evaluated: true
        }
      });
    });

    it('drops an object whose toJSON returns undefined', () => {
      expect(serializeMacroResult({ keep: 1, gone: { toJSON: () => undefined } })).toEqual({ result: { keep: 1 } });
    });

    it('falls back to own properties when toJSON throws', () => {
      const value = { a: 1, toJSON: () => { throw new Error('nope'); } };
      expect(serializeMacroResult(value)).toEqual({ result: { a: 1 } });
    });

    it('serializes an object whose toJSON returns itself as a plain object', () => {
      const value: Record<string, unknown> = { a: 1 };
      value['toJSON'] = () => value;
      expect(serializeMacroResult(value)).toEqual({ result: { a: 1 } });
    });
  });

  describe('arrays and plain objects', () => {
    it('converts every element of an array', () => {
      expect(serializeMacroResult([1, 'a', null, [2, 3], { b: 4n }])).toEqual({
        result: [1, 'a', null, [2, 3], { b: '4' }]
      });
    });

    it('uses only own enumerable string-keyed properties', () => {
      const proto = { inherited: 1 };
      const value = Object.create(proto) as Record<string | symbol, unknown>;
      value['own'] = 2;
      value[Symbol('sym')] = 3;
      Object.defineProperty(value, 'hidden', { value: 4, enumerable: false });

      expect(serializeMacroResult(value)).toEqual({ result: { own: 2 } });
    });

    it('converts a class instance by its own properties', () => {
      class Outcome {
        hit = true;
        damage = [{ type: 'slashing', amount: 7 }];
        describe(): string {
          return 'hit';
        }
      }
      expect(serializeMacroResult(new Outcome())).toEqual({
        result: { hit: true, damage: [{ type: 'slashing', amount: 7 }] }
      });
    });
  });

  describe('cycles and depth', () => {
    it('replaces a value already on the current path with "[Circular]"', () => {
      const a: Record<string, unknown> = { name: 'a' };
      a['self'] = a;
      expect(serializeMacroResult(a)).toEqual({ result: { name: 'a', self: '[Circular]' } });
    });

    it('replaces a cycle through an array', () => {
      const list: unknown[] = [1];
      list.push({ back: list });
      expect(serializeMacroResult(list)).toEqual({ result: [1, { back: '[Circular]' }] });
    });

    it('serializes the same object twice when it is shared but not on the path', () => {
      const shared = { v: 1 };
      expect(serializeMacroResult({ first: shared, second: shared })).toEqual({
        result: { first: { v: 1 }, second: { v: 1 } }
      });
    });

    it('keeps 32 levels of nesting', () => {
      const { result } = serializeMacroResult(nest(32));
      expect(innermost(result, 32)).toEqual({});
    });

    it('replaces the 33rd level with "[MaxDepth]"', () => {
      const { result } = serializeMacroResult(nest(33));
      expect(innermost(result, 33)).toBe('[MaxDepth]');
      expect(innermost(result, 32)).toEqual({ a: '[MaxDepth]' });
    });

    it('counts arrays as levels too', () => {
      let value: unknown = 'leaf';
      for (let i = 0; i < 33; i++) {
        value = [value];
      }
      const { result } = serializeMacroResult(value);
      let current: unknown = result;
      for (let i = 0; i < 32; i++) {
        current = (current as unknown[])[0];
      }
      expect(current).toBe('[MaxDepth]');
    });
  });

  describe('size cap', () => {
    it('exports the 256 KB cap', () => {
      expect(MACRO_RESULT_MAX_BYTES).toBe(262_144);
    });

    it('passes a string whose JSON is exactly the cap', () => {
      const text = 'a'.repeat(MACRO_RESULT_MAX_BYTES - 2);
      expect(serializeMacroResult(text)).toEqual({ result: text });
    });

    it('truncates one byte over the cap and reports the exact size without a result', () => {
      const text = 'a'.repeat(MACRO_RESULT_MAX_BYTES - 1);
      const serialized = serializeMacroResult(text);
      expect(serialized).toEqual({ resultTruncated: true, resultBytes: MACRO_RESULT_MAX_BYTES + 1 });
      expect('result' in serialized).toBe(false);
    });

    it('counts multi-byte characters as UTF-8', () => {
      const fits = 'ё'.repeat(MACRO_RESULT_MAX_BYTES / 2 - 1);
      expect(serializeMacroResult(fits)).toEqual({ result: fits });

      const over = 'ё'.repeat(MACRO_RESULT_MAX_BYTES / 2);
      expect(serializeMacroResult(over)).toEqual({ resultTruncated: true, resultBytes: MACRO_RESULT_MAX_BYTES + 2 });
    });

    it('measures the converted object, not the original', () => {
      const payload = { text: 'b'.repeat(MACRO_RESULT_MAX_BYTES), dropped: () => 1 };
      const serialized = serializeMacroResult(payload);
      expect(serialized.resultTruncated).toBe(true);
      expect(serialized.resultBytes).toBe(JSON.stringify({ text: payload.text }).length);
    });
  });
});
