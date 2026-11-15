import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  JournalCanvasNotReadyError,
  JournalNoteNotFoundError,
  JournalNotFoundError,
  JournalUserNotFoundError
} from '../../domain';
import { JournalSharingService } from '../JournalSharingService';
import { FakeImageSharer, FakeNoteNavigator, FakeUserDirectory } from './fakeFeaturePorts';
import { FakeJournalStore, journal } from './fakePorts';

interface Setup {
  service: JournalSharingService;
  images: FakeImageSharer;
  notes: FakeNoteNavigator;
}

function setup(notes = new FakeNoteNavigator(), images = new FakeImageSharer()): Setup {
  const service = new JournalSharingService({
    journals: new FakeJournalStore([journal({ id: 'j1' })]),
    images,
    users: new FakeUserDirectory(['u1', 'u2']),
    notes
  });
  return { service, images, notes };
}

describe('JournalSharingService', () => {
  describe('showImage', () => {
    it('shares the image with every connected user', async () => {
      const { service, images } = setup();

      const shown = await service.showImage({ src: 'maps/keep.webp', title: 'The Keep', users: [] });

      expect(shown).toEqual({ src: 'maps/keep.webp', title: 'The Keep', caption: undefined, users: [] });
      expect(images.shared).toEqual([shown]);
    });

    it('shares the image with the listed users', async () => {
      const { service, images } = setup();

      await service.showImage({ src: 'a.png', caption: 'Look', users: ['u1', 'u2'] });

      expect(images.shared[0]?.users).toEqual(['u1', 'u2']);
    });

    it('refuses a user the world does not have, before sharing anything', async () => {
      const { service, images } = setup();

      await expect(service.showImage({ src: 'a.png', users: ['u1', 'ghost'] })).rejects.toThrow(
        new JournalUserNotFoundError('ghost')
      );
      expect(images.shared).toEqual([]);
    });

    it('refuses where the core offers no way to share an image', async () => {
      const images = new FakeImageSharer();
      images.available = false;

      await expect(setup(undefined, images).service.showImage({ src: 'a.png', users: [] })).rejects.toThrow(
        CoreFeatureUnavailableError
      );
    });
  });

  describe('panToNote', () => {
    const note = { noteId: 'n1', sceneId: 'scene-1', x: 100, y: 200 };

    it('pans to the journal note on the viewed scene', async () => {
      const { service, notes } = setup(new FakeNoteNavigator('scene-1', { j1: note }));

      const panned = await service.panToNote({ journalId: 'j1', view: { scale: 2, duration: 500 } });

      expect(panned).toEqual({ journalId: 'j1', note });
      expect(notes.panned).toEqual([{ journalId: 'j1', view: { scale: 2, duration: 500 } }]);
    });

    it('refuses a journal that does not exist', async () => {
      const { service, notes } = setup(new FakeNoteNavigator('scene-1', { j1: note }));

      await expect(service.panToNote({ journalId: 'nope', view: {} })).rejects.toThrow(new JournalNotFoundError('nope'));
      expect(notes.panned).toEqual([]);
    });

    it('refuses while the canvas is not ready', async () => {
      const { service } = setup(new FakeNoteNavigator(null));

      await expect(service.panToNote({ journalId: 'j1', view: {} })).rejects.toThrow(new JournalCanvasNotReadyError());
    });

    it('refuses when the journal has no note on the viewed scene, instead of panning to nothing', async () => {
      const { service, notes } = setup(new FakeNoteNavigator('scene-1'));

      await expect(service.panToNote({ journalId: 'j1', view: {} })).rejects.toThrow(
        new JournalNoteNotFoundError('j1', 'scene-1')
      );
      await expect(service.panToNote({ journalId: 'j1', view: {} })).rejects.toThrow(
        'Map note not found for journal j1 on the viewed scene scene-1'
      );
      expect(notes.panned).toEqual([]);
    });
  });
});
