import type { FoundryCardDocument, FoundryCardSource } from '../foundryCardTypes';
import type { FoundryCardGlobals, FoundryCardsDocument } from '../foundryCardsTypes';

/**
 * A client Card as the probe of Foundry 13.351 / 14.368 showed it: stored
 * fields in `_source` (a face without a name has no `name` key, the back of a
 * new card is `{ text: '', img: null }`), the shown image on the document.
 */
export function cardDocument(
  id: string,
  source: Partial<FoundryCardSource> = {},
  extra: Partial<Omit<FoundryCardDocument, '_source'>> = {}
): FoundryCardDocument {
  return {
    id,
    _source: {
      name: `Card ${id}`,
      description: '',
      type: 'base',
      suit: '',
      value: null,
      faces: [{ name: `Card ${id}`, text: '', img: `cards/${id}.webp` }],
      face: 0,
      back: { text: '', img: null },
      drawn: false,
      sort: 0,
      system: {},
      flags: {},
      ...source
    },
    img: `cards/${id}.webp`,
    origin: null,
    update: jest.fn().mockResolvedValue(undefined),
    flip: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    discard: jest.fn().mockResolvedValue(undefined),
    toMessage: jest.fn().mockResolvedValue({ id: 'msg1' }),
    ...extra
  };
}

/** A client Cards document; `availableCards` and `drawnCards` follow the core's getters. */
export function stackDocument(
  id: string,
  type: string,
  cards: FoundryCardDocument[] = [],
  overrides: Partial<FoundryCardsDocument> = {}
): FoundryCardsDocument {
  return {
    id,
    uuid: `Cards.${id}`,
    name: `Stack ${id}`,
    type,
    img: 'icons/svg/card-hand.svg',
    description: '',
    folder: null,
    ownership: { default: 0 },
    cards: { contents: cards, get: (cardId) => cards.find((card) => card.id === cardId) },
    get availableCards() {
      return cards.filter((card) => type !== 'deck' || !card._source.drawn);
    },
    get drawnCards() {
      return cards.filter((card) => card._source.drawn);
    },
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    shuffle: jest.fn().mockResolvedValue(undefined),
    deal: jest.fn().mockResolvedValue(undefined),
    draw: jest.fn().mockResolvedValue([]),
    pass: jest.fn().mockResolvedValue([]),
    recall: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

export interface FakeGlobals extends FoundryCardGlobals {
  create: jest.Mock;
  fetchMock: jest.Mock;
}

export function globalsFor(stacks: FoundryCardsDocument[], overrides: Partial<FoundryCardGlobals> = {}): FakeGlobals {
  const create = jest.fn().mockResolvedValue(undefined);
  const fetchMock = jest.fn();
  const folders = new Map([
    ['f-cards', { type: 'Cards' }],
    ['f-actors', { type: 'Actor' }]
  ]);
  return {
    game: {
      cards: { contents: stacks, get: (id) => stacks.find((stack) => stack.id === id) },
      folders: { get: (id) => folders.get(id) },
      model: { Card: { base: {} } }
    },
    CONFIG: {
      Cards: {
        documentClass: { create },
        presets: {
          pokerDark: { type: 'deck', src: 'cards/poker-deck-dark.json' },
          pokerLight: { type: 'deck', src: 'cards/poker-deck-light.json' }
        }
      }
    },
    foundry: { utils: { mergeObject: (original, other) => ({ ...original, ...other }) } },
    fetch: fetchMock,
    create,
    fetchMock,
    ...overrides
  };
}
