import { FoundryImageSharer, FoundryUserDirectory } from '../FoundryImageSharer';
import { FoundryNoteNavigator } from '../FoundryNoteNavigator';
import type { FoundryCanvasNote, FoundryJournalCanvas, FoundryJournalGlobals } from '../foundryJournalTypes';

function note(id: string, entryId: string | null, x = 0, y = 0): FoundryCanvasNote {
  return { document: { id, entryId, x, y } };
}

describe('FoundryImageSharer', () => {
  function globalsWith(layout: '13+' | '11-12', showImage?: jest.Mock): FoundryJournalGlobals {
    const journalClass = showImage !== undefined ? { show: jest.fn(), showImage } : { show: jest.fn() };
    const base = { game: { journal: undefined }, JournalEntry: { create: jest.fn() } };
    return (
      layout === '13+'
        ? {
            ...base,
            foundry: { documents: { collections: { Journal: journalClass } } },
            get Journal(): never {
              throw new Error('the deprecated alias must not be read');
            }
          }
        : { ...base, Journal: journalClass }
    ) as FoundryJournalGlobals;
  }

  it('shares through Journal.showImage, sending only the title and caption given', async () => {
    const showImage = jest.fn();
    const sharer = new FoundryImageSharer(() => globalsWith('13+', showImage));

    expect(sharer.isAvailable()).toBe(true);
    await sharer.share({ src: 'maps/keep.webp', title: 'The Keep', users: ['u1'] });
    await sharer.share({ src: 'a.png', caption: 'Look', users: [] });

    expect(showImage).toHaveBeenNthCalledWith(1, 'maps/keep.webp', { users: ['u1'], title: 'The Keep' });
    expect(showImage).toHaveBeenNthCalledWith(2, 'a.png', { users: [], caption: 'Look' });
  });

  it('uses the bare Journal global where the namespace does not exist', async () => {
    const showImage = jest.fn();
    const sharer = new FoundryImageSharer(() => globalsWith('11-12', showImage));

    await sharer.share({ src: 'a.png', users: [] });

    expect(showImage).toHaveBeenCalledWith('a.png', { users: [] });
  });

  it('is unavailable when the journal class has no showImage', () => {
    expect(new FoundryImageSharer(() => globalsWith('11-12')).isAvailable()).toBe(false);
  });
});

describe('FoundryUserDirectory', () => {
  it('knows the users of the world', () => {
    const users = new Map([['u1', { id: 'u1' }]]);
    const globals = { game: { journal: undefined, users } } as unknown as FoundryJournalGlobals;
    const directory = new FoundryUserDirectory(() => globals);

    expect(directory.hasUser('u1')).toBe(true);
    expect(directory.hasUser('ghost')).toBe(false);
  });
});

describe('FoundryNoteNavigator', () => {
  function navigatorOver(canvas: FoundryJournalCanvas | null | undefined, panToNote = jest.fn()): FoundryNoteNavigator {
    const entry = { id: 'j1', panToNote };
    const globals = {
      game: { journal: { get: (id: string) => (id === 'j1' ? entry : undefined) } },
      canvas
    } as unknown as FoundryJournalGlobals;
    return new FoundryNoteNavigator(() => globals);
  }

  const readyCanvas: FoundryJournalCanvas = {
    ready: true,
    scene: { id: 'scene-1' },
    notes: { placeables: [note('n0', 'other'), note('n1', 'j1', 100, 200), note('n2', 'j1', 5, 5)] }
  };

  it('knows nothing while the canvas is not ready or missing', () => {
    for (const canvas of [{ ...readyCanvas, ready: false }, null, undefined]) {
      const navigator = navigatorOver(canvas);
      expect(navigator.viewedSceneId()).toBeNull();
      expect(navigator.findSceneNote('j1')).toBeNull();
    }
  });

  it('finds the first note of the journal on the viewed scene, as JournalEntry#sceneNote does', () => {
    const navigator = navigatorOver(readyCanvas);

    expect(navigator.viewedSceneId()).toBe('scene-1');
    expect(navigator.findSceneNote('j1')).toEqual({ noteId: 'n1', sceneId: 'scene-1', x: 100, y: 200 });
    expect(navigator.findSceneNote('none')).toBeNull();
  });

  it('pans through JournalEntry#panToNote, passing only the options given', async () => {
    const panToNote = jest.fn().mockResolvedValue(undefined);
    const navigator = navigatorOver(readyCanvas, panToNote);

    await navigator.panToNote('j1', { scale: 2 });
    await navigator.panToNote('j1', { duration: 0 });

    expect(panToNote).toHaveBeenNthCalledWith(1, { scale: 2 });
    expect(panToNote).toHaveBeenNthCalledWith(2, { duration: 0 });
  });
});
