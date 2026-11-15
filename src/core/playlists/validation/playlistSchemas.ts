import { z } from 'zod';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored
// and values are not range-checked — the core decides what it accepts. Where a
// handler fell back to a default with `??`, `null` still means "not given".

const playlistRequestShape = { playlistId: z.string() };
const playlistSoundRequestShape = { playlistId: z.string(), soundId: z.string() };

export const getPlaylistRequestSchema = z.object(playlistRequestShape);
export const playPlaylistRequestSchema = z.object(playlistRequestShape);
export const stopPlaylistRequestSchema = z.object(playlistRequestShape);

export const playSoundInPlaylistRequestSchema = z.object(playlistSoundRequestShape);
export const stopSoundInPlaylistRequestSchema = z.object(playlistSoundRequestShape);

export const addSoundToPlaylistRequestSchema = z.object({
  playlistId: z.string(),
  name: z.string(),
  path: z.string(),
  volume: z.number().optional(),
  repeat: z.boolean().optional(),
  description: z.string().optional()
});

export const playSoundOnceRequestSchema = z.object({
  src: z.string(),
  volume: z.number().nullish(),
  loop: z.boolean().nullish(),
  broadcast: z.boolean().nullish()
});

export type GetPlaylistRequest = z.infer<typeof getPlaylistRequestSchema>;
export type PlayPlaylistRequest = z.infer<typeof playPlaylistRequestSchema>;
export type StopPlaylistRequest = z.infer<typeof stopPlaylistRequestSchema>;
export type PlaySoundInPlaylistRequest = z.infer<typeof playSoundInPlaylistRequestSchema>;
export type StopSoundInPlaylistRequest = z.infer<typeof stopSoundInPlaylistRequestSchema>;
export type AddSoundToPlaylistRequest = z.infer<typeof addSoundToPlaylistRequestSchema>;
export type PlaySoundOnceRequest = z.infer<typeof playSoundOnceRequestSchema>;
