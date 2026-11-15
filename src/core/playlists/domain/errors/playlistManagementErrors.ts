import { DomainError, ValidationError } from '@/kernel';

export class PlaylistCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create playlist');
    this.name = 'PlaylistCreationFailedError';
    Object.setPrototypeOf(this, PlaylistCreationFailedError.prototype);
  }
}

export class PlaylistFolderNotFoundError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'PlaylistFolderNotFoundError';
    Object.setPrototypeOf(this, PlaylistFolderNotFoundError.prototype);
  }
}

export class NotAPlaylistFolderError extends DomainError {
  constructor(folderId: string, folderType: string) {
    super(`Folder ${folderId} holds ${folderType} documents, not playlists`);
    this.name = 'NotAPlaylistFolderError';
    Object.setPrototypeOf(this, NotAPlaylistFolderError.prototype);
  }
}

export class PlaylistNotSteppableError extends DomainError {
  constructor(playlistId: string, mode: string) {
    super(`Playlist ${playlistId} plays in ${mode} mode; only sequential and shuffle playlists step from sound to sound`);
    this.name = 'PlaylistNotSteppableError';
    Object.setPrototypeOf(this, PlaylistNotSteppableError.prototype);
  }
}

export class PlaylistNotPlayingError extends DomainError {
  constructor(playlistId: string) {
    super(`Playlist ${playlistId} is not playing`);
    this.name = 'PlaylistNotPlayingError';
    Object.setPrototypeOf(this, PlaylistNotPlayingError.prototype);
  }
}

export class NotAnAudioFileError extends ValidationError {
  constructor(path: string, extensions: readonly string[]) {
    super(`path must be an audio file (${extensions.join(', ')}): ${path}`);
    this.name = 'NotAnAudioFileError';
    Object.setPrototypeOf(this, NotAnAudioFileError.prototype);
  }
}
