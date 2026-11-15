import type {
  DirectoryListing,
  DirectoryQuery,
  FileSource,
  FileStorage,
  StoragePath,
  UploadableFile
} from '../../domain';

/**
 * Directories keyed by their client path, listed the way the server's
 * `LocalFileStorage` lists them (probed on 13.351 / 14.368): a path naming a
 * file lists its parent.
 */
export class FakeFileStorage implements FileStorage {
  sources: FileSource[] = ['data', 'public'];
  world: string | null = 'w';
  readonly queries: DirectoryQuery[] = [];
  readonly created: string[] = [];
  readonly uploads: Array<{ directory: string; file: UploadableFile }> = [];
  private readonly directories = new Map<string, { dirs: string[]; files: string[] }>();

  constructor(tree: Record<string, { dirs?: string[]; files?: string[] }> = {}) {
    for (const [path, entries] of Object.entries(tree)) {
      this.directories.set(path, { dirs: entries.dirs ?? [], files: entries.files ?? [] });
    }
  }

  availableSources(): readonly FileSource[] {
    return this.sources;
  }

  worldId(): string | null {
    return this.world;
  }

  listDirectory(query: DirectoryQuery): Promise<DirectoryListing | null> {
    this.queries.push(query);
    let path = query.path.toClientPath();
    let entries = this.directories.get(path);
    if (entries === undefined) {
      const parent = query.path.parent().toClientPath();
      const parentEntries = this.directories.get(parent);
      if (parentEntries?.files.includes(path) === true) {
        path = parent;
        entries = parentEntries;
      }
    }
    if (entries === undefined) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      source: query.source,
      path,
      bucket: query.bucket,
      directories: entries.dirs,
      files: entries.files
    });
  }

  createDirectory(path: StoragePath): Promise<void> {
    this.created.push(path.toString());
    return Promise.resolve();
  }

  uploadFile(directory: StoragePath, file: UploadableFile): Promise<string> {
    this.uploads.push({ directory: directory.toString(), file });
    return Promise.resolve(directory.child(file.name).toClientPath());
  }
}

export function pngFile(name = 'map.png'): UploadableFile {
  return { name, mediaType: { kind: 'image', mimeType: 'image/png' }, base64: 'aGVsbG8=', byteLength: 5 };
}
