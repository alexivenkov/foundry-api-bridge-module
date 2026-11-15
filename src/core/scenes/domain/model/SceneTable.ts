// What the GM controls about the table as a whole: which scene the players
// look at, what their clients load, the weather catalogue, fog and thumbnails.

export interface WeatherEffect {
  readonly id: string;
  readonly label: string;
}

export interface TableUser {
  readonly id: string;
  /** Connected right now. */
  readonly active: boolean;
}

export interface PulledUsers {
  readonly sceneId: string;
  readonly pulledUserIds: readonly string[];
  readonly offlineUserIds: readonly string[];
  readonly levelId?: string | undefined;
}

/** Why the core cannot draw a thumbnail for a scene. */
export type ThumbnailBlocker = 'noCanvas' | 'nothingToDraw';

export interface SceneThumbnail {
  readonly sceneId: string;
  readonly thumb: string | null;
}
