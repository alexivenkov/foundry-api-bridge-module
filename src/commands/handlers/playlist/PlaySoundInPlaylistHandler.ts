import type { PlaySoundInPlaylistParams, PlaySoundInPlaylistResult } from '@/commands/types';
import { getGame } from './playlistTypes';

export async function playSoundInPlaylistHandler(
  params: PlaySoundInPlaylistParams
): Promise<PlaySoundInPlaylistResult> {
  const playlist = getGame().playlists.get(params.playlistId);
  if (!playlist) {
    throw new Error(`Playlist not found: ${params.playlistId}`);
  }

  const sound = playlist.sounds.get(params.soundId);
  if (!sound) {
    throw new Error(`Sound not found in playlist ${params.playlistId}: ${params.soundId}`);
  }

  await playlist.playSound(sound);

  return {
    playing: true,
    playlistId: params.playlistId,
    soundId: params.soundId,
    soundName: sound.name
  };
}
