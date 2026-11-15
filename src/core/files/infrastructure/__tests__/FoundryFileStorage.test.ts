import {
  DirectoryAlreadyExistsError,
  FileOperationFailedError,
  StoragePath,
  type DirectoryQuery,
  type UploadableFile
} from '../../domain';
import { FoundryFileStorage } from '../FoundryFileStorage';
import type { FileConstructor, FoundryFileGlobals, FoundryFilePickerClass } from '../foundryFileTypes';

interface Picker {
  browse: jest.Mock;
  createDirectory: jest.Mock;
  upload: jest.Mock;
}

function picker(): Picker {
  return { browse: jest.fn(), createDirectory: jest.fn(), upload: jest.fn() };
}

class FakeFile {
  constructor(
    readonly parts: BlobPart[],
    readonly name: string,
    readonly options?: FilePropertyBag
  ) {}
}

function globals(filePicker: Picker | undefined, overrides: Partial<FoundryFileGlobals> = {}): () => FoundryFileGlobals {
  const implementation = filePicker as unknown as FoundryFilePickerClass | undefined;
  return () => ({
    game: { world: { id: 'w' }, data: { files: { storages: ['data', 'public'] } } },
    foundry: { applications: { apps: { FilePicker: implementation ? { implementation } : {} } } },
    File: FakeFile as unknown as FileConstructor,
    ...overrides
  });
}

function query(overrides: Partial<DirectoryQuery> = {}): DirectoryQuery {
  return { source: 'data', path: StoragePath.parse('worlds/w'), bucket: null, extensions: [], wildcard: false, ...overrides };
}

const png: UploadableFile = {
  name: 'Cave Map.png',
  mediaType: { kind: 'image', mimeType: 'image/png' },
  base64: 'aGk=',
  byteLength: 2
};

describe('FoundryFileStorage', () => {
  describe('environment', () => {
    it('reads the offered storages in a stable order and the world id', () => {
      const storage = new FoundryFileStorage(
        globals(picker(), { game: { world: { id: 'my-world' }, data: { files: { storages: ['s3', 'data'] } } } })
      );
      expect(storage.availableSources()).toEqual(['data', 's3']);
      expect(storage.worldId()).toBe('my-world');
    });

    it('reads no world and no storages before the game is set up', () => {
      const storage = new FoundryFileStorage(globals(picker(), { game: {} }));
      expect(storage.availableSources()).toEqual([]);
      expect(storage.worldId()).toBeNull();
    });
  });

  describe('listDirectory', () => {
    it('browses the encoded path and maps the answer of the server (13.351 / 14.368 shape)', async () => {
      const filePicker = picker();
      filePicker.browse.mockResolvedValue({
        target: 'worlds/w/My%20Maps',
        private: false,
        gridSize: null,
        dirs: ['worlds/w/My%20Maps/old'],
        privateDirs: [],
        files: ['worlds/w/My%20Maps/b.webp'],
        extensions: []
      });
      const listing = await new FoundryFileStorage(globals(filePicker)).listDirectory(
        query({ path: StoragePath.parse('worlds/w/My Maps') })
      );
      expect(filePicker.browse).toHaveBeenCalledWith('data', 'worlds/w/My%20Maps', {});
      expect(listing).toEqual({
        source: 'data',
        path: 'worlds/w/My%20Maps',
        bucket: null,
        directories: ['worlds/w/My%20Maps/old'],
        files: ['worlds/w/My%20Maps/b.webp']
      });
    });

    it('passes bucket, extensions and wildcard only when set', async () => {
      const filePicker = picker();
      filePicker.browse.mockResolvedValue({ target: 'maps', bucket: 'assets', dirs: [], files: [] });
      const listing = await new FoundryFileStorage(globals(filePicker)).listDirectory(
        query({ source: 's3', path: StoragePath.parse('maps/*.webp'), bucket: 'assets', extensions: ['.webp'], wildcard: true })
      );
      expect(filePicker.browse).toHaveBeenCalledWith('s3', 'maps/*.webp', {
        bucket: 'assets',
        extensions: ['.webp'],
        wildcard: true
      });
      expect(listing?.bucket).toBe('assets');
    });

    it('reads the server text of a missing directory as null', async () => {
      const filePicker = picker();
      filePicker.browse.mockRejectedValue(
        new Error('Directory worlds/w/nope does not exist or is not accessible in this storage location')
      );
      await expect(new FoundryFileStorage(globals(filePicker)).listDirectory(query())).resolves.toBeNull();
    });

    it('redacts host paths from any other refusal', async () => {
      const filePicker = picker();
      filePicker.browse.mockRejectedValue(new Error("EACCES: permission denied, scandir '/srv/foundry/Data/worlds/w'"));
      const result = new FoundryFileStorage(globals(filePicker)).listDirectory(query());
      await expect(result).rejects.toThrow(FileOperationFailedError);
      await expect(result).rejects.toThrow("Failed to browse files: EACCES: permission denied, scandir '<path>'");
    });

    it('falls back to the global FilePicker of older generations', async () => {
      const legacy = picker();
      legacy.browse.mockResolvedValue({ target: 'worlds/w', dirs: [], files: [] });
      const storage = new FoundryFileStorage(globals(undefined, { foundry: {}, FilePicker: legacy as unknown as FoundryFilePickerClass }));
      await storage.listDirectory(query());
      expect(legacy.browse).toHaveBeenCalledTimes(1);
    });

    it('fails clearly without any FilePicker', async () => {
      const storage = new FoundryFileStorage(globals(undefined));
      await expect(storage.listDirectory(query())).rejects.toThrow('The FilePicker API is not available');
    });
  });

  describe('createDirectory', () => {
    it('creates the raw path in the data source', async () => {
      const filePicker = picker();
      filePicker.createDirectory.mockResolvedValue('/srv/foundry/Data/worlds/w/My Maps');
      await new FoundryFileStorage(globals(filePicker)).createDirectory(StoragePath.parse('worlds/w/My%20Maps'));
      expect(filePicker.createDirectory).toHaveBeenCalledWith('data', 'worlds/w/My Maps', {});
    });

    it('maps EEXIST to an existing directory and redacts other refusals', async () => {
      const filePicker = picker();
      filePicker.createDirectory.mockRejectedValueOnce(
        new Error("EEXIST: file already exists, mkdir '/srv/foundry/Data/worlds/w/new'")
      );
      filePicker.createDirectory.mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory, mkdir '/srv/foundry/Data/worlds/w/x/y'")
      );
      const storage = new FoundryFileStorage(globals(filePicker));
      await expect(storage.createDirectory(StoragePath.parse('worlds/w/new'))).rejects.toThrow(
        new DirectoryAlreadyExistsError('worlds/w/new')
      );
      await expect(storage.createDirectory(StoragePath.parse('worlds/w/x/y'))).rejects.toThrow(
        "Failed to create directory: ENOENT: no such file or directory, mkdir '<path>'"
      );
    });
  });

  describe('uploadFile', () => {
    it('uploads the decoded bytes to the raw directory without notifications', async () => {
      const filePicker = picker();
      filePicker.upload.mockResolvedValue({
        status: 'success',
        message: 'Cave Map.png saved to worlds/w/My Maps',
        path: 'worlds/w/My%20Maps/Cave%20Map.png'
      });
      const stored = await new FoundryFileStorage(globals(filePicker)).uploadFile(StoragePath.parse('worlds/w/My Maps'), png);

      expect(stored).toBe('worlds/w/My%20Maps/Cave%20Map.png');
      const [source, target, file, body, options] = filePicker.upload.mock.calls[0] as [string, string, FakeFile, unknown, unknown];
      expect([source, target, body, options]).toEqual(['data', 'worlds/w/My Maps', {}, { notify: false }]);
      expect(file.name).toBe('Cave Map.png');
      expect(file.options).toEqual({ type: 'image/png' });
      expect(Array.from(file.parts[0] as Uint8Array)).toEqual([104, 105]);
    });

    it.each([
      [false, 'Failed to upload file: the server refused it'],
      [undefined, 'Failed to upload file: the core reported no stored path'],
      [{}, 'Failed to upload file: the core reported no stored path']
    ])('fails when the core answers %j', async (answer, message) => {
      const filePicker = picker();
      filePicker.upload.mockResolvedValue(answer);
      await expect(
        new FoundryFileStorage(globals(filePicker)).uploadFile(StoragePath.parse('worlds/w'), png)
      ).rejects.toThrow(message);
    });

    it('redacts a thrown refusal', async () => {
      const filePicker = picker();
      filePicker.upload.mockRejectedValue(new Error('Target directory /srv/foundry/Data/worlds/w/x does not exist.'));
      await expect(
        new FoundryFileStorage(globals(filePicker)).uploadFile(StoragePath.parse('worlds/w/x'), png)
      ).rejects.toThrow('Failed to upload file: Target directory <path> does not exist.');
    });
  });
});
