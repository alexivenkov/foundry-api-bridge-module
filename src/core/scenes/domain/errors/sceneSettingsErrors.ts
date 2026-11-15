import { DomainError } from '@/kernel';

export class WeatherEffectNotFoundError extends DomainError {
  constructor(readonly weatherId: string) {
    super(`Weather effect not found: ${weatherId}`);
    this.name = 'WeatherEffectNotFoundError';
    Object.setPrototypeOf(this, WeatherEffectNotFoundError.prototype);
  }
}

export class PlaylistNotFoundError extends DomainError {
  constructor(readonly playlistId: string) {
    super(`Playlist not found: ${playlistId}`);
    this.name = 'PlaylistNotFoundError';
    Object.setPrototypeOf(this, PlaylistNotFoundError.prototype);
  }
}

export class PlaylistSoundNotFoundError extends DomainError {
  constructor(readonly soundId: string) {
    super(`Playlist sound not found: ${soundId}`);
    this.name = 'PlaylistSoundNotFoundError';
    Object.setPrototypeOf(this, PlaylistSoundNotFoundError.prototype);
  }
}

export class JournalEntryNotFoundError extends DomainError {
  constructor(readonly journalId: string) {
    super(`Journal entry not found: ${journalId}`);
    this.name = 'JournalEntryNotFoundError';
    Object.setPrototypeOf(this, JournalEntryNotFoundError.prototype);
  }
}

export class JournalPageNotFoundError extends DomainError {
  constructor(readonly pageId: string) {
    super(`Journal page not found: ${pageId}`);
    this.name = 'JournalPageNotFoundError';
    Object.setPrototypeOf(this, JournalPageNotFoundError.prototype);
  }
}

/** A sound or page was named for a scene that links no playlist or journal entry. */
export class SceneLinkWithoutParentError extends DomainError {
  constructor(child: 'playlistSoundId' | 'journalPageId') {
    super(
      child === 'playlistSoundId'
        ? 'A playlist sound needs a playlist: set playlistId as well'
        : 'A journal page needs a journal entry: set journalId as well'
    );
    this.name = 'SceneLinkWithoutParentError';
    Object.setPrototypeOf(this, SceneLinkWithoutParentError.prototype);
  }
}

export class GlobalLightDarknessRangeError extends DomainError {
  constructor(
    readonly min: number,
    readonly max: number
  ) {
    super(`Global light darkness min (${String(min)}) may not exceed max (${String(max)})`);
    this.name = 'GlobalLightDarknessRangeError';
    Object.setPrototypeOf(this, GlobalLightDarknessRangeError.prototype);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class SceneThumbnailUnavailableError extends DomainError {
  constructor(reason: 'noCanvas' | 'nothingToDraw', sceneId: string) {
    super(
      reason === 'noCanvas'
        ? 'Scene thumbnails cannot be generated while the canvas is disabled'
        : `Scene ${sceneId} has no background image or tiles to draw a thumbnail from`
    );
    this.name = 'SceneThumbnailUnavailableError';
    Object.setPrototypeOf(this, SceneThumbnailUnavailableError.prototype);
  }
}
