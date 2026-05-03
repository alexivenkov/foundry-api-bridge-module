import type { StopSoundInPlaylistParams, StopSoundInPlaylistResult } from '@/commands/types';
import { getGame } from './playlistTypes';

export async function stopSoundInPlaylistHandler(
  params: StopSoundInPlaylistParams
): Promise<StopSoundInPlaylistResult> {
  const playlist = getGame().playlists.get(params.playlistId);
  if (!playlist) {
    throw new Error(`Playlist not found: ${params.playlistId}`);
  }

  const sound = playlist.sounds.get(params.soundId);
  if (!sound) {
    throw new Error(`Sound not found in playlist ${params.playlistId}: ${params.soundId}`);
  }

  await playlist.stopSound(sound);

  return {
    stopped: true,
    playlistId: params.playlistId,
    soundId: params.soundId
  };
}
