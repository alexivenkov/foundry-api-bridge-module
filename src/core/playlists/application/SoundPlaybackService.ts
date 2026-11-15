import { SoundPlayerUnavailableError, type SoundPlayer } from '@/core/playlists/domain';
import type { PlaySoundOnceCommand } from './commands';

export interface SoundPlaybackServiceDependencies {
  readonly player: SoundPlayer;
}

export class SoundPlaybackService {
  constructor(private readonly deps: SoundPlaybackServiceDependencies) {}

  async playOnce(command: PlaySoundOnceCommand): Promise<void> {
    if (!this.deps.player.isAvailable()) {
      throw new SoundPlayerUnavailableError();
    }
    await this.deps.player.play(command.sound, command.broadcast);
  }
}
