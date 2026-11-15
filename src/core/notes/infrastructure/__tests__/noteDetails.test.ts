import { FoundryNoteEnvironment, noteFeaturesFor } from '../FoundryNoteEnvironment';
import type { FoundryNoteDocument, FoundryNoteGame } from '../foundryNoteTypes';
import { toFoundryNoteData, toNote } from '../noteMapper';

function document(overrides: Partial<FoundryNoteDocument> = {}): FoundryNoteDocument {
  return {
    id: 'n1',
    _id: 'n1',
    x: 10,
    y: 20,
    entryId: null,
    pageId: null,
    text: 'Gate',
    texture: { src: 'icons/svg/book.svg', tint: '#ffffff' },
    iconSize: 40,
    fontSize: 32,
    textAnchor: 1,
    textColor: '#ffffff',
    global: false,
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

describe('note details mapping', () => {
  it('reads elevation, sort, font, lock and levels, a blank font as the default one', () => {
    expect(
      toNote(document({ elevation: 3, sort: 2, fontFamily: '', locked: true, levels: new Set(['ground']) }))
    ).toMatchObject({ elevation: 3, sort: 2, fontFamily: null, locked: true, levels: ['ground'] });
    expect(toNote(document({ fontFamily: 'Modesto Condensed' })).fontFamily).toBe('Modesto Condensed');
  });

  it('leaves out what the document does not store', () => {
    const note = toNote(document());
    for (const field of ['elevation', 'sort', 'fontFamily', 'locked', 'levels']) {
      expect(note).not.toHaveProperty(field);
    }
  });

  it('writes the default font as an empty string and the levels without duplicates', () => {
    expect(toFoundryNoteData({ fontFamily: null, elevation: 3, sort: 2, locked: true, levels: ['a', 'a', 'b'] })).toEqual({
      fontFamily: '',
      elevation: 3,
      sort: 2,
      locked: true,
      levels: ['a', 'b']
    });
  });
});

describe('FoundryNoteEnvironment', () => {
  it('knows locks and levels from Foundry 14 on', () => {
    expect(noteFeaturesFor(13).levels).toBe(false);
    expect(noteFeaturesFor(14).levels).toBe(true);
    expect(noteFeaturesFor(0).levels).toBe(true);
  });

  it('lists the level ids of a scene, none for a scene without levels', () => {
    const game = {
      scenes: {
        get: (id: string) => (id === 'keep' ? { id: 'keep', levels: { contents: [{ id: 'ground' }] } } : undefined),
        active: null
      }
    } as unknown as FoundryNoteGame;
    const environment = new FoundryNoteEnvironment({ getGame: () => game }, () => 14);
    expect(environment.listSceneLevelIds('keep')).toEqual(['ground']);
    expect(environment.listSceneLevelIds('nowhere')).toEqual([]);
  });
});
