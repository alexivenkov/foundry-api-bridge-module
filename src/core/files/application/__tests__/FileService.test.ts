import {
  DirectoryAlreadyExistsError,
  DirectoryNotFoundError,
  FileAlreadyExistsError,
  FileStorageUnavailableError,
  InvalidBrowseRequestError,
  NoWorldLoadedError,
  PathIsDirectoryError,
  PathOutsideWorldError,
  ProtectedWorldFolderError,
  StoragePath,
  type DirectoryQuery
} from '../../domain';
import { FileService } from '../FileService';
import { FakeFileStorage, pngFile } from './fakePorts';

function setup(): { service: FileService; storage: FakeFileStorage } {
  const storage = new FakeFileStorage({
    '': { dirs: ['worlds', 'systems'] },
    worlds: { dirs: ['worlds/w', 'worlds/other'] },
    'worlds/w': { dirs: ['worlds/w/My%20Maps', 'worlds/w/data'], files: ['worlds/w/a.png'] },
    'worlds/w/My%20Maps': { files: ['worlds/w/My%20Maps/Old%20Map.webp'] }
  });
  return { service: new FileService({ storage }), storage };
}

function browseQuery(overrides: Partial<DirectoryQuery> = {}): DirectoryQuery {
  return { source: 'data', path: StoragePath.parse('worlds/w'), bucket: null, extensions: [], wildcard: false, ...overrides };
}

describe('FileService', () => {
  describe('browse', () => {
    it('returns the listing of the directory', async () => {
      const { service } = setup();
      const listing = await service.browse(browseQuery());
      expect(listing).toEqual({
        source: 'data',
        path: 'worlds/w',
        bucket: null,
        directories: ['worlds/w/My%20Maps', 'worlds/w/data'],
        files: ['worlds/w/a.png']
      });
    });

    it('passes the query on unchanged', async () => {
      const { service, storage } = setup();
      const query = browseQuery({ path: StoragePath.parse('worlds/w/*.png'), extensions: ['.png'], wildcard: true });
      await service.browse(query).catch(() => undefined);
      expect(storage.queries[0]).toBe(query);
    });

    it('refuses a source the server does not offer', async () => {
      const { service } = setup();
      await expect(service.browse(browseQuery({ source: 's3' }))).rejects.toThrow(FileStorageUnavailableError);
      await expect(service.browse(browseQuery({ source: 's3' }))).rejects.toThrow(
        "File storage 's3' is not available on this server"
      );
    });

    it('refuses a bucket outside s3', async () => {
      const { service } = setup();
      await expect(service.browse(browseQuery({ bucket: 'maps' }))).rejects.toThrow(InvalidBrowseRequestError);
    });

    it('reports a missing directory', async () => {
      const { service } = setup();
      await expect(service.browse(browseQuery({ path: StoragePath.parse('worlds/w/nope') }))).rejects.toThrow(
        new DirectoryNotFoundError('worlds/w/nope')
      );
    });
  });

  describe('createDirectory', () => {
    it('creates a directory inside the world and returns its client path', async () => {
      const { service, storage } = setup();
      const result = await service.createDirectory({ path: StoragePath.parse('worlds/w/My Maps/New Dungeon') });
      expect(result).toEqual({ path: 'worlds/w/My%20Maps/New%20Dungeon' });
      expect(storage.created).toEqual(['worlds/w/My Maps/New Dungeon']);
    });

    it('refuses an existing directory or file name, ignoring case', async () => {
      const { service, storage } = setup();
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/w/my maps') })).rejects.toThrow(
        DirectoryAlreadyExistsError
      );
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/w/A.png') })).rejects.toThrow(
        'Directory already exists: worlds/w/A.png'
      );
      expect(storage.created).toEqual([]);
    });

    it('refuses a missing parent', async () => {
      const { service } = setup();
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/w/x/y') })).rejects.toThrow(
        'Directory not found: worlds/w/x'
      );
    });

    it('refuses paths outside the world and the world database folders before touching storage', async () => {
      const { service, storage } = setup();
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/other/x') })).rejects.toThrow(
        PathOutsideWorldError
      );
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/w/packs/x') })).rejects.toThrow(
        ProtectedWorldFolderError
      );
      expect(storage.queries).toEqual([]);
    });

    it('refuses when the data source is unavailable or no world is loaded', async () => {
      const { service, storage } = setup();
      storage.world = null;
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/w/x') })).rejects.toThrow(
        NoWorldLoadedError
      );
      storage.sources = ['public'];
      await expect(service.createDirectory({ path: StoragePath.parse('worlds/w/x') })).rejects.toThrow(
        FileStorageUnavailableError
      );
    });
  });

  describe('uploadFile', () => {
    it('uploads into a world directory and returns the stored path', async () => {
      const { service, storage } = setup();
      const result = await service.uploadFile({
        directory: StoragePath.parse('worlds/w/My%20Maps'),
        file: pngFile('Cave.png'),
        overwrite: false
      });
      expect(result).toEqual({ path: 'worlds/w/My%20Maps/Cave.png', size: 5, overwritten: false });
      expect(storage.uploads[0]?.directory).toBe('worlds/w/My Maps');
    });

    it('accepts the world directory itself', async () => {
      const { service } = setup();
      const result = await service.uploadFile({ directory: StoragePath.parse('worlds/w'), file: pngFile(), overwrite: false });
      expect(result.path).toBe('worlds/w/map.png');
    });

    it('refuses to replace an existing file unless asked, ignoring case', async () => {
      const { service, storage } = setup();
      const command = { directory: StoragePath.parse('worlds/w/My Maps'), file: pngFile('old map.WEBP'), overwrite: false };
      await expect(service.uploadFile(command)).rejects.toThrow(
        'File already exists: worlds/w/My%20Maps/old%20map.WEBP; pass overwrite: true to replace it'
      );
      expect(storage.uploads).toEqual([]);

      const replaced = await service.uploadFile({ ...command, overwrite: true });
      expect(replaced.overwritten).toBe(true);
    });

    it('refuses a name taken by a directory even with overwrite', async () => {
      const { service } = setup();
      await expect(
        service.uploadFile({ directory: StoragePath.parse('worlds/w'), file: pngFile('my maps'), overwrite: true })
      ).rejects.toThrow(PathIsDirectoryError);
    });

    it('refuses a missing directory and a path that names a file', async () => {
      const { service, storage } = setup();
      await expect(
        service.uploadFile({ directory: StoragePath.parse('worlds/w/nope'), file: pngFile(), overwrite: false })
      ).rejects.toThrow(new DirectoryNotFoundError('worlds/w/nope'));
      await expect(
        service.uploadFile({ directory: StoragePath.parse('worlds/w/a.png'), file: pngFile(), overwrite: false })
      ).rejects.toThrow(new DirectoryNotFoundError('worlds/w/a.png'));
      expect(storage.uploads).toEqual([]);
    });

    it('refuses targets outside the world', async () => {
      const { service } = setup();
      await expect(
        service.uploadFile({ directory: StoragePath.parse('systems/dnd5e'), file: pngFile(), overwrite: true })
      ).rejects.toThrow(PathOutsideWorldError);
      await expect(
        service.uploadFile({ directory: StoragePath.parse('worlds/w/data'), file: pngFile(), overwrite: true })
      ).rejects.toThrow(ProtectedWorldFolderError);
    });

    it('rejects with FileAlreadyExistsError carrying the target path', async () => {
      const { service } = setup();
      const error: unknown = await service
        .uploadFile({ directory: StoragePath.parse('worlds/w'), file: pngFile('a.png'), overwrite: false })
        .catch((thrown: unknown) => thrown);
      expect(error).toBeInstanceOf(FileAlreadyExistsError);
      expect((error as FileAlreadyExistsError).path).toBe('worlds/w/a.png');
    });
  });
});
