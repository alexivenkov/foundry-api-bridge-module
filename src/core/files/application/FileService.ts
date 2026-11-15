import {
  DirectoryAlreadyExistsError,
  DirectoryNotFoundError,
  FileAlreadyExistsError,
  FileStorageUnavailableError,
  InvalidBrowseRequestError,
  NoWorldLoadedError,
  PathIsDirectoryError,
  assertWritableWorldPath,
  decodedName,
  type DirectoryListing,
  type FileSource,
  type FileStorage,
  type StoragePath
} from '@/core/files/domain';
import type {
  BrowseFilesQuery,
  CreateDirectoryCommand,
  CreatedDirectory,
  UploadFileCommand,
  UploadedFile
} from './commands';

export interface FileServiceDependencies {
  readonly storage: FileStorage;
}

type EntryKind = 'directory' | 'file';

/**
 * Browses any storage the server offers; writes only into the current world's
 * directory of the `data` source. Existence is checked before writing because
 * the core overwrites a media file silently and answers a missing directory
 * with an error naming the host path.
 */
export class FileService {
  constructor(private readonly deps: FileServiceDependencies) {}

  async browse(query: BrowseFilesQuery): Promise<DirectoryListing> {
    this.requireSource(query.source);
    if (query.bucket !== null && query.source !== 's3') {
      throw new InvalidBrowseRequestError("bucket is only valid with source 's3'");
    }
    const listing = await this.deps.storage.listDirectory(query);
    if (listing === null) {
      throw new DirectoryNotFoundError(query.path.toClientPath());
    }
    return listing;
  }

  async createDirectory(command: CreateDirectoryCommand): Promise<CreatedDirectory> {
    this.requireWritablePath(command.path, false, 'path');
    const parent = await this.requireDataDirectory(command.path.parent());
    if (findEntry(parent, command.path.name ?? '') !== null) {
      throw new DirectoryAlreadyExistsError(command.path.toClientPath());
    }
    await this.deps.storage.createDirectory(command.path);
    return { path: command.path.toClientPath() };
  }

  async uploadFile(command: UploadFileCommand): Promise<UploadedFile> {
    this.requireWritablePath(command.directory, true, 'directory');
    const directory = await this.requireDataDirectory(command.directory);
    const target = command.directory.child(command.file.name).toClientPath();
    const existing = findEntry(directory, command.file.name);
    if (existing === 'directory') {
      throw new PathIsDirectoryError(target);
    }
    if (existing === 'file' && !command.overwrite) {
      throw new FileAlreadyExistsError(target);
    }
    const path = await this.deps.storage.uploadFile(command.directory, command.file);
    return { path, size: command.file.byteLength, overwritten: existing === 'file' };
  }

  private requireSource(source: FileSource): void {
    if (!this.deps.storage.availableSources().includes(source)) {
      throw new FileStorageUnavailableError(source);
    }
  }

  private requireWritablePath(path: StoragePath, allowWorldRoot: boolean, field: string): void {
    this.requireSource('data');
    const worldId = this.deps.storage.worldId();
    if (worldId === null) {
      throw new NoWorldLoadedError();
    }
    assertWritableWorldPath(path, worldId, { allowWorldRoot, field });
  }

  private async requireDataDirectory(path: StoragePath): Promise<DirectoryListing> {
    const listing = await this.deps.storage.listDirectory({
      source: 'data',
      path,
      bucket: null,
      extensions: [],
      wildcard: false
    });
    // The core lists the parent when the path names a file; uploading there would hang the request.
    if (listing === null || listing.path !== path.toClientPath()) {
      throw new DirectoryNotFoundError(path.toClientPath());
    }
    return listing;
  }
}

/**
 * Names are compared without case: on a case-insensitive host `Map.png`
 * replaces `map.png`.
 */
function findEntry(listing: DirectoryListing, name: string): EntryKind | null {
  const wanted = name.toLowerCase();
  const matches = (path: string): boolean => decodedName(path)?.toLowerCase() === wanted;
  if (listing.directories.some(matches)) {
    return 'directory';
  }
  return listing.files.some(matches) ? 'file' : null;
}
