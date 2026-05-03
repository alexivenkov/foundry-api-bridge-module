import type { PlayPlaylistParams, PlayPlaylistResult } from '@/commands/types';
import { getGame } from './playlistTypes';

export async function playPlaylistHandler(params: PlayPlaylistParams): Promise<PlayPlaylistResult> {
  const playlist = getGame().playlists.get(params.playlistId);
  if (!playlist) {
    throw new Error(`Playlist not found: ${params.playlistId}`);
  }

  const updated = await playlist.playAll();
  const playingSounds = updated.sounds.contents.filter(s => s.playing).length;

  return {
    playing: true,
    playlistId: params.playlistId,
    soundCount: playingSounds
  };
}
