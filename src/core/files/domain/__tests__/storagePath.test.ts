import { ValidationError } from '../../../../kernel';
import { InvalidStoragePathError, StoragePath, assertWritableSegments, decodedName, encodeSegment } from '..';

describe('StoragePath', () => {
  it('splits a path into segments and drops a leading or trailing slash', () => {
    expect(StoragePath.parse('/worlds/w/maps/').segments).toEqual(['worlds', 'w', 'maps']);
    expect(StoragePath.parse('').isRoot).toBe(true);
    expect(StoragePath.parse('/').isRoot).toBe(true);
  });

  it('decodes each segment once, so the encoded and the raw form are the same path', () => {
    expect(StoragePath.parse('worlds/w/My%20Maps').segments).toEqual(['worlds', 'w', 'My Maps']);
    expect(StoragePath.parse('worlds/w/My Maps').segments).toEqual(['worlds', 'w', 'My Maps']);
    expect(StoragePath.parse('worlds/w/100%25').segments).toEqual(['worlds', 'w', '100%']);
  });

  it.each([
    ['worlds/../systems', "'..' segments are not allowed"],
    ['worlds/w/%2e%2e/%2e%2e/escaped', "'..' segments are not allowed"],
    ['worlds/./w', "'.' segments are not allowed"],
    ['worlds//w', 'empty segment'],
    ['worlds/w/a%2Fb', 'slash'],
    ['worlds\\w', 'backslash'],
    ['worlds/w/%zz', 'not valid percent-encoding'],
    ['worlds/w/a\u0000b', 'control characters']
  ])('rejects %s', (raw, reason) => {
    expect(() => StoragePath.parse(raw)).toThrow(InvalidStoragePathError);
    expect(() => StoragePath.parse(raw)).toThrow(reason);
  });

  it('names the request field in its error', () => {
    expect(() => StoragePath.parse('a/../b', 'directory')).toThrow("Invalid directory 'a/../b'");
    expect(() => StoragePath.parse('a/../b')).toThrow(ValidationError);
  });

  it('renders the raw form for writes and the encoded form the core reports', () => {
    const path = StoragePath.parse('worlds/w/My Maps/it\'s');
    expect(path.toString()).toBe("worlds/w/My Maps/it's");
    expect(path.toClientPath()).toBe('worlds/w/My%20Maps/it%27s');
  });

  it('navigates to the parent and to a child', () => {
    const path = StoragePath.parse('worlds/w/maps');
    expect(path.name).toBe('maps');
    expect(path.parent().toString()).toBe('worlds/w');
    expect(path.child('x y').toClientPath()).toBe('worlds/w/maps/x%20y');
    expect(StoragePath.ROOT.name).toBeNull();
  });

  it('encodes a segment the way the core encodes paths', () => {
    expect(encodeSegment("a b'c#?")).toBe('a%20b%27c%23%3F');
  });

  it('reads the decoded last segment of a reported path', () => {
    expect(decodedName('worlds/w/My%20Map.png')).toBe('My Map.png');
    expect(decodedName('worlds/w/%zz')).toBeNull();
  });

  describe('assertWritableSegments', () => {
    it('accepts ordinary names', () => {
      expect(() => assertWritableSegments(StoragePath.parse('worlds/w/My Maps (old)'), 'path')).not.toThrow();
    });

    it.each(['worlds/w/100%25', 'worlds/w/a:b', 'worlds/w/a*b', 'worlds/w/a?b', 'worlds/w/a<b', 'worlds/w/dot.', 'worlds/w/space '])(
      'rejects %s',
      (raw) => {
        expect(() => assertWritableSegments(StoragePath.parse(raw), 'path')).toThrow(InvalidStoragePathError);
      }
    );
  });
});
