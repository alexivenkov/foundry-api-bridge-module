import type {
  PlaylistMode,
  PlaylistChannel,
  PlaylistSummary,
  PlaylistDetail,
  PlaylistSoundSummary
} from '@/commands/types';

export interface FoundryPlaylistSound {
  id: string;
  name: string;
  path: string;
  playing: boolean;
  volume: number;
  repeat: boolean;
  fade: number | null | undefined;
  description: string | null | undefined;
  update(data: Record<string, unknown>): Promise<FoundryPlaylistSound>;
  delete(): Promise<FoundryPlaylistSound>;
}

export interface FoundryPlaylistSoundCollection {
  contents: ReadonlyArray<FoundryPlaylistSound>;
  get(id: string): FoundryPlaylistSound | undefined;
}

export interface FoundryPlaylist {
  id: string;
  uuid: string;
  name: string;
  mode: number;
  fade: number | null | undefined;
  channel: PlaylistChannel | null | undefined;
  playing: boolean;
  description: string | null | undefined;
  folder: { id: string; name: string } | null | undefined;
  sounds: FoundryPlaylistSoundCollection;
  playAll(): Promise<FoundryPlaylist>;
  stopAll(): Promise<FoundryPlaylist>;
  playSound(sound: FoundryPlaylistSound): Promise<FoundryPlaylist>;
  stopSound(sound: FoundryPlaylistSound): Promise<FoundryPlaylist>;
  createEmbeddedDocuments(
    type: 'PlaylistSound',
    data: Record<string, unknown>[]
  ): Promise<FoundryPlaylistSound[]>;
  update(data: Record<string, unknown>): Promise<FoundryPlaylist>;
  delete(): Promise<FoundryPlaylist>;
}

export interface FoundryPlaylistsCollection {
  contents: ReadonlyArray<FoundryPlaylist>;
  get(id: string): FoundryPlaylist | undefined;
}

export interface FoundryGame {
  playlists: FoundryPlaylistsCollection;
}

export interface FoundryAudioHelper {
  play(
    data: { src: string; volume?: number; autoplay?: boolean; loop?: boolean },
    broadcast?: boolean
  ): Promise<unknown>;
}

export function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export function getAudioHelper(): FoundryAudioHelper {
  const f = (globalThis as unknown as {
    foundry?: { audio?: { AudioHelper?: FoundryAudioHelper } };
  }).foundry;
  if (f?.audio?.AudioHelper && typeof f.audio.AudioHelper.play === 'function') {
    return f.audio.AudioHelper;
  }

  const legacy = (globalThis as unknown as { AudioHelper?: FoundryAudioHelper }).AudioHelper;
  if (legacy && typeof legacy.play === 'function') {
    return legacy;
  }

  throw new Error('AudioHelper API not available');
}

const MODE_TO_STRING: Record<number, PlaylistMode> = {
  [-1]: 'soundboard',
  0: 'disabled',
  1: 'sequential',
  2: 'shuffle',
  3: 'simultaneous'
};

const MODE_TO_NUMBER: Record<PlaylistMode, number> = {
  soundboard: -1,
  disabled: 0,
  sequential: 1,
  shuffle: 2,
  simultaneous: 3
};

export function modeFromNumber(n: number): PlaylistMode {
  return MODE_TO_STRING[n] ?? 'disabled';
}

export function modeToNumber(m: PlaylistMode): number {
  return MODE_TO_NUMBER[m];
}

export function mapSoundToSummary(sound: FoundryPlaylistSound): PlaylistSoundSummary {
  return {
    id: sound.id,
    name: sound.name,
    path: sound.path,
    playing: sound.playing,
    volume: sound.volume,
    repeat: sound.repeat
  };
}

export function mapPlaylistToSummary(p: FoundryPlaylist): PlaylistSummary {
  return {
    id: p.id,
    uuid: p.uuid,
    name: p.name,
    mode: modeFromNumber(p.mode),
    channel: p.channel ?? null,
    fade: p.fade ?? null,
    playing: p.playing,
    description: p.description ?? null,
    folder: p.folder?.name ?? null,
    soundCount: p.sounds.contents.length
  };
}

export function mapPlaylistToDetail(p: FoundryPlaylist): PlaylistDetail {
  return {
    ...mapPlaylistToSummary(p),
    sounds: p.sounds.contents.map(mapSoundToSummary)
  };
}
