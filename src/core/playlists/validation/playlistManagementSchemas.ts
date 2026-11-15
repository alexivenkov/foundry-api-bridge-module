import { z } from 'zod';
import {
  MAX_IMPORTED_SOUNDS,
  PLAYLIST_CHANNELS,
  PLAYLIST_MODES,
  PLAYLIST_SORTINGS,
  PLAYLIST_STEP_DIRECTIONS
} from '@/core/playlists/domain';

// The management commands validate strictly: a number the core would clamp
// or round (volume, fade) is rejected instead. Unknown keys are ignored.

const id = z.string().min(1);
const name = z.string().min(1);
const playlistFade = z.number().int().min(1);
const soundFade = z.number().int().min(0);

export const createPlaylistRequestSchema = z.object({
  name,
  description: z.string().optional(),
  mode: z.enum(PLAYLIST_MODES).optional(),
  channel: z.enum(PLAYLIST_CHANNELS).optional(),
  fade: playlistFade.optional(),
  sorting: z.enum(PLAYLIST_SORTINGS).optional(),
  folderId: z.string().nullish()
});

export const updatePlaylistRequestSchema = z.object({
  playlistId: id,
  name: name.optional(),
  description: z.string().nullable().optional(),
  mode: z.enum(PLAYLIST_MODES).optional(),
  channel: z.enum(PLAYLIST_CHANNELS).optional(),
  fade: playlistFade.nullable().optional(),
  sorting: z.enum(PLAYLIST_SORTINGS).optional(),
  folderId: id.nullable().optional()
});

export const deletePlaylistRequestSchema = z.object({
  playlistId: id
});

export const updatePlaylistSoundRequestSchema = z.object({
  playlistId: id,
  soundId: id,
  name: name.optional(),
  path: id.optional(),
  description: z.string().nullable().optional(),
  volume: z.number().min(0).max(1).optional(),
  repeat: z.boolean().optional(),
  fade: soundFade.nullable().optional(),
  channel: z.enum(PLAYLIST_CHANNELS).nullable().optional(),
  sort: z.number().int().optional()
});

export const deletePlaylistSoundRequestSchema = z.object({
  playlistId: id,
  soundId: id
});

export const playNextInPlaylistRequestSchema = z.object({
  playlistId: id,
  direction: z.enum(PLAYLIST_STEP_DIRECTIONS).optional()
});

export const importPlaylistSoundsRequestSchema = z.object({
  playlistId: id,
  paths: z.array(id).min(1).max(MAX_IMPORTED_SOUNDS)
});

export type CreatePlaylistRequest = z.infer<typeof createPlaylistRequestSchema>;
export type UpdatePlaylistRequest = z.infer<typeof updatePlaylistRequestSchema>;
export type DeletePlaylistRequest = z.infer<typeof deletePlaylistRequestSchema>;
export type UpdatePlaylistSoundRequest = z.infer<typeof updatePlaylistSoundRequestSchema>;
export type DeletePlaylistSoundRequest = z.infer<typeof deletePlaylistSoundRequestSchema>;
export type PlayNextInPlaylistRequest = z.infer<typeof playNextInPlaylistRequestSchema>;
export type ImportPlaylistSoundsRequest = z.infer<typeof importPlaylistSoundsRequestSchema>;
