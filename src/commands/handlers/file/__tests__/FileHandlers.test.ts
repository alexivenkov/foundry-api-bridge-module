import type { FileWiring, FoundryFileGlobals } from '../../../../core/files';
import { createBrowseFilesHandler } from '../BrowseFilesHandler';
import { createCreateDirectoryHandler } from '../CreateDirectoryHandler';
import { createUploadFileHandler } from '../UploadFileHandler';

interface Server {
  wiring: FileWiring;
  browse: jest.Mock;
  createDirectory: jest.Mock;
  upload: jest.Mock;
}

class FakeFile {
  constructor(
    readonly parts: BlobPart[],
    readonly name: string
  ) {}
}

// Directory answers as the server's LocalFileStorage gives them (probed on 13.351 / 14.368).
const TREE: Record<string, { dirs: string[]; files: string[] }> = {
  'worlds/w': { dirs: ['worlds/w/maps'], files: ['worlds/w/a.png'] },
  'worlds/w/maps': { dirs: [], files: ['worlds/w/maps/cave.webp'] }
};

function server(): Server {
  const browse = jest.fn((_source: string, target: string) => {
    const entries = TREE[target];
    if (entries === undefined) {
      return Promise.reject(
        new Error(`Directory ${target} does not exist or is not accessible in this storage location`)
      );
    }
    return Promise.resolve({ target, private: false, gridSize: null, privateDirs: [], extensions: [], ...entries });
  });
  const createDirectory = jest.fn().mockResolvedValue('/srv/Data/worlds/w/new');
  const upload = jest.fn((_source: string, path: string, file: FakeFile) =>
    Promise.resolve({ status: 'success', message: `${file.name} saved to ${path}`, path: `${path}/${file.name}` })
  );
  const implementation = { browse, createDirectory, upload };
  const globals = (): FoundryFileGlobals =>
    ({
      game: { world: { id: 'w' }, data: { files: { storages: ['data', 'public'] } } },
      foundry: { applications: { apps: { FilePicker: { implementation } } } },
      File: FakeFile
    }) as unknown as FoundryFileGlobals;
  return { wiring: { globals }, browse, createDirectory, upload };
}

describe('file handlers', () => {
  it('browse-files lists a directory', async () => {
    const { wiring } = server();
    await expect(createBrowseFilesHandler(wiring)({ path: 'worlds/w' })).resolves.toEqual({
      source: 'data',
      path: 'worlds/w',
      bucket: null,
      directories: ['worlds/w/maps'],
      files: ['worlds/w/a.png']
    });
  });

  it('browse-files rejects an invalid source and reports a missing directory', async () => {
    const { wiring } = server();
    const handler = createBrowseFilesHandler(wiring);
    await expect(handler({ source: 'local' as never })).rejects.toThrow('source');
    await expect(handler({ path: 'worlds/x' })).rejects.toThrow('Directory not found: worlds/x');
    await expect(handler({ source: 's3' })).rejects.toThrow("File storage 's3' is not available on this server");
  });

  it('create-directory creates a directory inside the world', async () => {
    const { wiring, createDirectory } = server();
    await expect(createCreateDirectoryHandler(wiring)({ path: 'worlds/w/maps/Deep Caves' })).resolves.toEqual({
      source: 'data',
      path: 'worlds/w/maps/Deep%20Caves'
    });
    expect(createDirectory).toHaveBeenCalledWith('data', 'worlds/w/maps/Deep Caves', {});
  });

  it('create-directory refuses paths outside the world and a missing parent', async () => {
    const { wiring, createDirectory } = server();
    const handler = createCreateDirectoryHandler(wiring);
    await expect(handler({ path: 'modules/evil' })).rejects.toThrow("Path 'modules/evil' is outside");
    await expect(handler({ path: 'worlds/w/../../modules' })).rejects.toThrow("'..' segments are not allowed");
    await expect(handler({ path: 'worlds/w/none/x' })).rejects.toThrow('Directory not found: worlds/w/none');
    expect(createDirectory).not.toHaveBeenCalled();
  });

  it('upload-file stores the file and returns the stored path', async () => {
    const { wiring, upload } = server();
    const result = await createUploadFileHandler(wiring)({
      directory: 'worlds/w/maps',
      fileName: 'tavern.jpg',
      content: 'aGVsbG8='
    });
    expect(result).toEqual({ source: 'data', path: 'worlds/w/maps/tavern.jpg', size: 5, overwritten: false });
    expect(upload).toHaveBeenCalledWith('data', 'worlds/w/maps', expect.any(FakeFile), {}, { notify: false });
  });

  it('upload-file refuses an existing file unless overwrite is set', async () => {
    const { wiring, upload } = server();
    const handler = createUploadFileHandler(wiring);
    const params = { directory: 'worlds/w/maps', fileName: 'Cave.webp', content: 'aGVsbG8=' };
    await expect(handler(params)).rejects.toThrow('File already exists: worlds/w/maps/Cave.webp');
    expect(upload).not.toHaveBeenCalled();
    await expect(handler({ ...params, overwrite: true })).resolves.toMatchObject({ overwritten: true });
  });

  it('upload-file refuses dangerous types and targets before uploading', async () => {
    const { wiring, upload } = server();
    const handler = createUploadFileHandler(wiring);
    await expect(handler({ directory: 'worlds/w', fileName: 'x.svg', content: 'aGk=' })).rejects.toThrow(
      "Files of type '.svg' may not be uploaded"
    );
    await expect(handler({ directory: 'systems/dnd5e', fileName: 'x.png', content: 'aGk=' })).rejects.toThrow(
      'outside the current world'
    );
    await expect(handler({ directory: 'worlds/w', fileName: 'x.png' } as never)).rejects.toThrow('content');
    expect(upload).not.toHaveBeenCalled();
  });
});
