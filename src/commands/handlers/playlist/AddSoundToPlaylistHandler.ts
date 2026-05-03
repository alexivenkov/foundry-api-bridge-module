import type { AddSoundToPlaylistParams, AddSoundToPlaylistResult } from '@/commands/types';
import { getGame, mapSoundToSummary } from './playlistTypes';

export async function addSoundToPlaylistHandler(
  params: AddSoundToPlaylistParams
): Promise<AddSoundToPlaylistResult> {
  const playlist = getGame().playlists.get(params.playlistId);
  if (!playlist) {
    throw new Error(`Playlist not found: ${params.playlistId}`);
  }

  const data: Record<string, unknown> = {
    name: params.name,
    path: params.path
  };

  if (params.volume !== undefined) {
    data['volume'] = params.volume;
  }

  if (params.repeat !== undefined) {
    data['repeat'] = params.repeat;
  }

  if (params.description !== undefined) {
    data['description'] = params.description;
  }

  const created = await playlist.createEmbeddedDocuments('PlaylistSound', [data]);
  const first = created[0];
  if (!first) {
    throw new Error('Sound creation returned no document');
  }

  return mapSoundToSummary(first);
}
