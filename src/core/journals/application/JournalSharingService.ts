import {
  JournalCanvasNotReadyError,
  JournalNoteNotFoundError,
  JournalNotFoundError,
  JournalUserNotFoundError,
  type ImageSharer,
  type JournalNoteNavigator,
  type JournalSceneNote,
  type JournalStore,
  type SharedImage,
  type UserDirectory
} from '@/core/journals/domain';
import { CoreFeatureUnavailableError } from '@/core/shared';
import type { PanToNoteCommand, ShowImageCommand } from './commands';

export interface JournalSharingServiceDependencies {
  readonly journals: JournalStore;
  readonly images: ImageSharer;
  readonly users: UserDirectory;
  readonly notes: JournalNoteNavigator;
}

export interface JournalNotePanned {
  readonly journalId: string;
  readonly note: JournalSceneNote;
}

/** What the GM puts in front of the players, or in front of himself: shared images, map notes. */
export class JournalSharingService {
  constructor(private readonly deps: JournalSharingServiceDependencies) {}

  async showImage(command: ShowImageCommand): Promise<SharedImage> {
    if (!this.deps.images.isAvailable()) {
      throw new CoreFeatureUnavailableError('Sharing an image is not available in this Foundry version');
    }
    const unknown = command.users.find((userId) => !this.deps.users.hasUser(userId));
    if (unknown !== undefined) {
      throw new JournalUserNotFoundError(unknown);
    }

    const image: SharedImage = {
      src: command.src,
      title: command.title,
      caption: command.caption,
      users: command.users
    };
    await this.deps.images.share(image);
    return image;
  }

  /** The core pans silently to nothing when the journal has no note on the viewed scene, so that is checked first. */
  async panToNote(command: PanToNoteCommand): Promise<JournalNotePanned> {
    if (this.deps.journals.findJournal(command.journalId) === null) {
      throw new JournalNotFoundError(command.journalId);
    }
    const sceneId = this.deps.notes.viewedSceneId();
    if (sceneId === null) {
      throw new JournalCanvasNotReadyError();
    }
    const note = this.deps.notes.findSceneNote(command.journalId);
    if (note === null) {
      throw new JournalNoteNotFoundError(command.journalId, sceneId);
    }

    await this.deps.notes.panToNote(command.journalId, command.view);
    return { journalId: command.journalId, note };
  }
}
