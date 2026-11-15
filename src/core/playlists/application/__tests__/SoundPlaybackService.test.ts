import { SoundPlayerUnavailableError, type OneShotSound, type SoundPlayer } from '../../domain';
import { SoundPlaybackService } from '../SoundPlaybackService';

class FakeSoundPlayer implements SoundPlayer {
  readonly played: Array<{ sound: OneShotSound; broadcast: boolean }> = [];

  constructor(private readonly available: boolean) {}

  isAvailable(): boolean {
    return this.available;
  }

  play(sound: OneShotSound, broadcast: boolean): Promise<void> {
    this.played.push({ sound, broadcast });
    return Promise.resolve();
  }
}

const door: OneShotSound = { src: 'sounds/door.ogg', volume: 0.8, loop: false };

describe('SoundPlaybackService', () => {
  it('plays the sound once, for everyone or for this client only', async () => {
    const player = new FakeSoundPlayer(true);
    const service = new SoundPlaybackService({ player });

    await service.playOnce({ sound: door, broadcast: true });
    await service.playOnce({ sound: door, broadcast: false });

    expect(player.played).toEqual([
      { sound: door, broadcast: true },
      { sound: door, broadcast: false }
    ]);
  });

  it('fails without playing anything when the client has no audio API', async () => {
    const player = new FakeSoundPlayer(false);
    const playback = new SoundPlaybackService({ player }).playOnce({ sound: door, broadcast: true });

    await expect(playback).rejects.toThrow(SoundPlayerUnavailableError);
    await expect(playback).rejects.toThrow('AudioHelper API not available');
    expect(player.played).toEqual([]);
  });
});
