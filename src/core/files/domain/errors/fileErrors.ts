import { DomainError, ValidationError } from '@/kernel';

export class InvalidStoragePathError extends ValidationError {
  constructor(field: string, raw: string, reason: string) {
    super(`Invalid ${field} '${raw}': ${reason}`);
    this.name = 'InvalidStoragePathError';
    Object.setPrototypeOf(this, InvalidStoragePathError.prototype);
  }
}

export class InvalidFileNameError extends ValidationError {
  constructor(fileName: string, reason: string) {
    super(`Invalid fileName '${fileName}': ${reason}`);
    this.name = 'InvalidFileNameError';
    Object.setPrototypeOf(this, InvalidFileNameError.prototype);
  }
}

export class FileTypeNotAllowedError extends ValidationError {
  constructor(extension: string, allowed: readonly string[]) {
    super(
      `Files of type '${extension}' may not be uploaded; allowed: ${allowed.join(', ')} ` +
        '(raster images, audio and video only)'
    );
    this.name = 'FileTypeNotAllowedError';
    Object.setPrototypeOf(this, FileTypeNotAllowedError.prototype);
  }
}

export class InvalidFileContentError extends ValidationError {
  constructor(reason: string) {
    super(`Invalid content: ${reason}`);
    this.name = 'InvalidFileContentError';
    Object.setPrototypeOf(this, InvalidFileContentError.prototype);
  }
}

export class FileTooLargeError extends ValidationError {
  constructor(byteLength: number, limit: number) {
    super(`The file is ${String(byteLength)} bytes; the limit is ${String(limit)} bytes`);
    this.name = 'FileTooLargeError';
    Object.setPrototypeOf(this, FileTooLargeError.prototype);
  }
}

export class InvalidBrowseRequestError extends ValidationError {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidBrowseRequestError';
    Object.setPrototypeOf(this, InvalidBrowseRequestError.prototype);
  }
}

export class FileStorageUnavailableError extends DomainError {
  constructor(public readonly source: string) {
    super(`File storage '${source}' is not available on this server`);
    this.name = 'FileStorageUnavailableError';
    Object.setPrototypeOf(this, FileStorageUnavailableError.prototype);
  }
}

export class NoWorldLoadedError extends DomainError {
  constructor() {
    super('No world is loaded');
    this.name = 'NoWorldLoadedError';
    Object.setPrototypeOf(this, NoWorldLoadedError.prototype);
  }
}

export class PathOutsideWorldError extends DomainError {
  constructor(path: string, worldId: string) {
    super(
      `Path '${path}' is outside the current world's directory; ` +
        `files may only be written under worlds/${worldId}/`
    );
    this.name = 'PathOutsideWorldError';
    Object.setPrototypeOf(this, PathOutsideWorldError.prototype);
  }
}

export class WorldDirectoryItselfError extends DomainError {
  constructor(path: string) {
    super(`Path '${path}' is the world directory itself; name a directory inside it`);
    this.name = 'WorldDirectoryItselfError';
    Object.setPrototypeOf(this, WorldDirectoryItselfError.prototype);
  }
}

export class ProtectedWorldFolderError extends DomainError {
  constructor(path: string, folder: string) {
    super(`Path '${path}' is inside the world's '${folder}' database folder, which may not be written`);
    this.name = 'ProtectedWorldFolderError';
    Object.setPrototypeOf(this, ProtectedWorldFolderError.prototype);
  }
}

export class DirectoryNotFoundError extends DomainError {
  constructor(public readonly path: string) {
    super(`Directory not found: ${path}`);
    this.name = 'DirectoryNotFoundError';
    Object.setPrototypeOf(this, DirectoryNotFoundError.prototype);
  }
}

export class DirectoryAlreadyExistsError extends DomainError {
  constructor(public readonly path: string) {
    super(`Directory already exists: ${path}`);
    this.name = 'DirectoryAlreadyExistsError';
    Object.setPrototypeOf(this, DirectoryAlreadyExistsError.prototype);
  }
}

export class FileAlreadyExistsError extends DomainError {
  constructor(public readonly path: string) {
    super(`File already exists: ${path}; pass overwrite: true to replace it`);
    this.name = 'FileAlreadyExistsError';
    Object.setPrototypeOf(this, FileAlreadyExistsError.prototype);
  }
}

export class PathIsDirectoryError extends DomainError {
  constructor(public readonly path: string) {
    super(`A directory already exists at ${path}`);
    this.name = 'PathIsDirectoryError';
    Object.setPrototypeOf(this, PathIsDirectoryError.prototype);
  }
}

/** The core refused a file operation; the text never carries a host file-system path. */
export class FileOperationFailedError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'FileOperationFailedError';
    Object.setPrototypeOf(this, FileOperationFailedError.prototype);
  }
}
