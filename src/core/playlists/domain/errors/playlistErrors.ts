import { DomainError } from '@/kernel';

export class PlaylistNotFoundError extends DomainError {
  constructor(public readonly playlistId: string) {
    super(`Playlist not found: ${playlistId}`);
    this.name = 'PlaylistNotFoundError';
    Object.setPrototypeOf(this, PlaylistNotFoundError.prototype);
  }
}

export class PlaylistSoundNotFoundError extends DomainError {
  constructor(
    public readonly playlistId: string,
    public readonly soundId: string
  ) {
    super(`Sound not found in playlist ${playlistId}: ${soundId}`);
    this.name = 'PlaylistSoundNotFoundError';
    Object.setPrototypeOf(this, PlaylistSoundNotFoundError.prototype);
  }
}

export class PlaylistSoundCreationFailedError extends DomainError {
  constructor() {
    super('Sound creation returned no document');
    this.name = 'PlaylistSoundCreationFailedError';
    Object.setPrototypeOf(this, PlaylistSoundCreationFailedError.prototype);
  }
}

export class SoundPlayerUnavailableError extends DomainError {
  constructor() {
    super('AudioHelper API not available');
    this.name = 'SoundPlayerUnavailableError';
    Object.setPrototypeOf(this, SoundPlayerUnavailableError.prototype);
  }
}
