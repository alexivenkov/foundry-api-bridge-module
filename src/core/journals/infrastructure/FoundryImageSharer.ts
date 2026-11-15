import type { ImageSharer, SharedImage, UserDirectory } from '@/core/journals/domain';
import { resolveJournalClass } from './foundryJournalClasses';
import type { FoundryShareImageOptions, JournalGlobalsProvider } from './foundryJournalTypes';

/**
 * `Journal.showImage` (13.351, 14.368): emits `shareImage`, which the server
 * relays to the sockets of the listed users, or to every other client when the
 * list is empty; each opens an ImagePopout. The core's own "show image only"
 * goes the same way. The GM's browser gets an info notification, not the image.
 */
export class FoundryImageSharer implements ImageSharer {
  constructor(private readonly globals: JournalGlobalsProvider) {}

  isAvailable(): boolean {
    return typeof resolveJournalClass(this.globals()).showImage === 'function';
  }

  share(image: SharedImage): Promise<void> {
    const options: FoundryShareImageOptions = { users: [...image.users] };
    if (image.title !== undefined) {
      options.title = image.title;
    }
    if (image.caption !== undefined) {
      options.caption = image.caption;
    }
    resolveJournalClass(this.globals()).showImage?.(image.src, options);
    return Promise.resolve();
  }
}

export class FoundryUserDirectory implements UserDirectory {
  constructor(private readonly globals: JournalGlobalsProvider) {}

  hasUser(userId: string): boolean {
    return this.globals().game.users?.get(userId) !== undefined;
  }
}
