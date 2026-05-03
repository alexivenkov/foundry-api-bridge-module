import type { StopPlaylistParams, StopPlaylistResult } from '@/commands/types';
import { getGame } from './playlistTypes';

export async function stopPlaylistHandler(params: StopPlaylistParams): Promise<StopPlaylistResult> {
  const playlist = getGame().playlists.get(params.playlistId);
  if (!playlist) {
    throw new Error(`Playlist not found: ${params.playlistId}`);
  }

  await playlist.stopAll();

  return {
    stopped: true,
    playlistId: params.playlistId
  };
}
