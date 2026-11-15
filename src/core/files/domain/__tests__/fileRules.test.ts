import {
  FileTooLargeError,
  FileTypeNotAllowedError,
  InvalidFileContentError,
  InvalidFileNameError,
  InvalidStoragePathError,
  MAX_UPLOAD_BYTES,
  PathOutsideWorldError,
  ProtectedWorldFolderError,
  StoragePath,
  UPLOAD_EXTENSIONS,
  WorldDirectoryItselfError,
  assertWritableWorldPath,
  parseBase64Payload,
  parseUploadFileName,
  redactFileSystemPaths
} from '..';

describe('assertWritableWorldPath', () => {
  const check = (raw: string, allowWorldRoot = false): void => {
    assertWritableWorldPath(StoragePath.parse(raw), 'my-world', { allowWorldRoot, field: 'path' });
  };

  it('accepts a directory inside the current world', () => {
    expect(() => {
      check('worlds/my-world/assets/maps');
    }).not.toThrow();
  });

  it('accepts the world directory itself only where allowed', () => {
    expect(() => {
      check('worlds/my-world', true);
    }).not.toThrow();
    expect(() => {
      check('worlds/my-world');
    }).toThrow(WorldDirectoryItselfError);
  });

  it.each([
    'systems/dnd5e/icons',
    'modules/foundry-api-bridge',
    'worlds/other-world/assets',
    'worlds',
    'assets',
    'Worlds/my-world/assets',
    'worlds/MY-WORLD/assets'
  ])('refuses %s', (raw) => {
    expect(() => {
      check(raw, true);
    }).toThrow(PathOutsideWorldError);
  });

  it('names the allowed prefix in the refusal', () => {
    expect(() => {
      check('modules/x');
    }).toThrow("Path 'modules/x' is outside the current world's directory; files may only be written under worlds/my-world/");
  });

  it.each(['worlds/my-world/data', 'worlds/my-world/packs/monsters', 'worlds/my-world/DATA/x', 'worlds/my-world/Packs'])(
    'refuses the world database folder in %s',
    (raw) => {
      expect(() => {
        check(raw, true);
      }).toThrow(ProtectedWorldFolderError);
    }
  );

  it('refuses a segment the core would decode differently between generations', () => {
    expect(() => {
      check('worlds/my-world/100%25');
    }).toThrow(InvalidStoragePathError);
  });
});

describe('parseUploadFileName', () => {
  it('accepts a raster image, audio and video and reports the media type', () => {
    expect(parseUploadFileName('Goblin Lair.WEBP')).toEqual({
      name: 'Goblin Lair.WEBP',
      extension: 'webp',
      mediaType: { kind: 'image', mimeType: 'image/webp' }
    });
    expect(parseUploadFileName('theme.mp3').mediaType.kind).toBe('audio');
    expect(parseUploadFileName('intro.mp4').mediaType.kind).toBe('video');
  });

  it('allows exactly the core image, audio and video extensions without svg', () => {
    expect([...UPLOAD_EXTENSIONS].sort()).toEqual(
      [
        'aac', 'apng', 'avif', 'bmp', 'flac', 'gif', 'jpeg', 'jpg', 'm4a', 'm4v', 'mid', 'mp3', 'mp4', 'ogg', 'ogv',
        'opus', 'png', 'tiff', 'wav', 'webm', 'webp'
      ].sort()
    );
  });

  it.each(['map.svg', 'page.html', 'notes.txt', 'data.json', 'font.woff2', 'model.glb', 'doc.pdf', 'x.constructor', 'x.toString'])(
    'refuses %s',
    (name) => {
      expect(() => parseUploadFileName(name)).toThrow(FileTypeNotAllowedError);
    }
  );

  it.each([
    ['', 'must be 1'],
    ['.png', 'may not start with a dot'],
    [' map.png', 'space'],
    ['map.png.', 'space'],
    ['map', 'needs an extension'],
    ['../map.png', 'may not start with a dot'],
    ['maps/map.png', 'may not contain'],
    ['map%2F.png', 'may not contain'],
    ['map?.png', 'may not contain'],
    ['a'.repeat(201) + '.png', 'must be 1']
  ])('refuses the name %j', (name, reason) => {
    expect(() => parseUploadFileName(name)).toThrow(InvalidFileNameError);
    expect(() => parseUploadFileName(name)).toThrow(reason);
  });
});

describe('parseBase64Payload', () => {
  it('validates base64 and reports the decoded size', () => {
    expect(parseBase64Payload('aGVsbG8=')).toEqual({ base64: 'aGVsbG8=', byteLength: 5 });
    expect(parseBase64Payload('aGVsbG8')).toEqual({ base64: 'aGVsbG8', byteLength: 5 });
    expect(parseBase64Payload('aGVs\nbG8h\r\n')).toEqual({ base64: 'aGVsbG8h', byteLength: 6 });
  });

  it.each(['not base64!', 'aGVsbG8=x', 'aGVsb', 'aGVsbG8==='])('refuses %j', (raw) => {
    expect(() => parseBase64Payload(raw)).toThrow(InvalidFileContentError);
  });

  it('refuses empty content', () => {
    expect(() => parseBase64Payload('  \n')).toThrow('Invalid content: the file is empty');
  });

  it('caps the decoded size', () => {
    expect(MAX_UPLOAD_BYTES).toBe(20 * 1024 * 1024);
    expect(() => parseBase64Payload('AAAAAAAA', 5)).toThrow(FileTooLargeError);
    expect(() => parseBase64Payload('AAAAAAAA', 5)).toThrow('The file is 6 bytes; the limit is 5 bytes');
    expect(parseBase64Payload('AAAAAAAA', 6).byteLength).toBe(6);
  });

  it('refuses an oversized payload before looking at its characters', () => {
    expect(() => parseBase64Payload('!'.repeat(100), 6)).toThrow(FileTooLargeError);
  });
});

describe('redactFileSystemPaths', () => {
  it.each([
    ["EEXIST: file already exists, mkdir '/home/fvtt/Data/worlds/w/new'", "EEXIST: file already exists, mkdir '<path>'"],
    ['Target directory /Users/gm/Data/worlds/w/x does not exist.', 'Target directory <path> does not exist.'],
    ['ENOENT: open C:\\Foundry\\Data\\x.png', 'ENOENT: open <path>'],
    ['scandir \\\\server\\share\\Data', 'scandir <path>']
  ])('redacts %j', (raw, redacted) => {
    expect(redactFileSystemPaths(raw)).toBe(redacted);
  });

  it('keeps relative client paths and MIME types', () => {
    const text = 'Directory worlds/w/nope does not exist or is not accessible; type image/png';
    expect(redactFileSystemPaths(text)).toBe(text);
  });
});
