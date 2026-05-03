import type { GetPlaylistsParams, GetPlaylistsResult } from '@/commands/types';
import { getGame, mapPlaylistToSummary } from './playlistTypes';

export function getPlaylistsHandler(_params: GetPlaylistsParams): Promise<GetPlaylistsResult> {
  void _params;
  return Promise.resolve(getGame().playlists.contents.map(mapPlaylistToSummary));
}
