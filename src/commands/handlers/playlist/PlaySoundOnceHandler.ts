import type { PlaySoundOnceParams, PlaySoundOnceResult } from '@/commands/types';
import { getAudioHelper } from './playlistTypes';

export async function playSoundOnceHandler(
  params: PlaySoundOnceParams
): Promise<PlaySoundOnceResult> {
  const helper = getAudioHelper();
  const broadcast = params.broadcast ?? true;
  const data = {
    src: params.src,
    volume: params.volume ?? 0.8,
    autoplay: true,
    loop: params.loop ?? false
  };

  await helper.play(data, broadcast);

  return {
    playing: true,
    src: params.src,
    broadcast
  };
}
