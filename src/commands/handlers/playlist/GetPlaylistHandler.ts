import type { GetPlaylistParams, GetPlaylistResult } from '@/commands/types';
import { getGame, mapPlaylistToDetail } from './playlistTypes';

export function getPlaylistHandler(params: GetPlaylistParams): Promise<GetPlaylistResult> {
  const playlist = getGame().playlists.get(params.playlistId);
  if (!playlist) {
    return Promise.reject(new Error(`Playlist not found: ${params.playlistId}`));
  }
  return Promise.resolve(mapPlaylistToDetail(playlist));
}
