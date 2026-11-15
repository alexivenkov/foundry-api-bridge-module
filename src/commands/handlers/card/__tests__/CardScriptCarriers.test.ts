import type { CardGlobalsProvider, FoundryCardGlobals } from '../../../../core/cards';
import type { FoundryCardDocument, FoundryCardsDocument } from '../../../../core/cards/infrastructure';
import { createCreateCardHandler } from '../CreateCardHandler';
import { createUpdateCardHandler } from '../UpdateCardHandler';

function cardDoc(id: string, flags: Record<string, unknown> = {}): FoundryCardDocument {
  return {
    id,
    _source: {
      name: `Card ${id}`,
      type: 'base',
      suit: 'clubs',
      value: 1,
      faces: [{ name: `Card ${id}`, text: '', img: `cards/${id}.webp` }],
      face: 0,
      back: { text: '', img: null },
      drawn: false,
      sort: 0,
      system: {},
      flags
    },
    img: `cards/${id}.webp`,
    origin: null,
    update: jest.fn().mockResolvedValue(undefined),
    flip: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    discard: jest.fn().mockResolvedValue(undefined),
    toMessage: jest.fn().mockResolvedValue({ id: 'msg1' })
  };
}

function pileDoc(cards: FoundryCardDocument[]): FoundryCardsDocument {
  return {
    id: 'pile',
    uuid: 'Cards.pile',
    name: 'PILE',
    type: 'pile',
    img: 'icons/svg/card-hand.svg',
    description: '',
    folder: null,
    ownership: { default: 0 },
    cards: { contents: cards, get: (cardId) => cards.find((card) => card.id === cardId) },
    availableCards: cards,
    drawnCards: [],
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    createEmbeddedDocuments: jest.fn().mockResolvedValue([cardDoc('new')]),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    shuffle: jest.fn().mockResolvedValue(undefined),
    deal: jest.fn().mockResolvedValue(undefined),
    draw: jest.fn().mockResolvedValue([]),
    pass: jest.fn().mockResolvedValue([]),
    recall: jest.fn().mockResolvedValue(undefined)
  };
}

function world(): { pile: FoundryCardsDocument; provider: CardGlobalsProvider } {
  const pile = pileDoc([cardDoc('fool', { 'midi-qol': { onUseMacroName: 'Kept' } })]);
  const globals: FoundryCardGlobals = {
    game: {
      cards: { contents: [pile], get: (id) => (id === 'pile' ? pile : undefined) },
      folders: { get: () => undefined },
      model: { Card: { base: {} } }
    },
    CONFIG: { Cards: { documentClass: { create: jest.fn() }, presets: {} } },
    foundry: { utils: { mergeObject: (original, other) => ({ ...original, ...other }) } },
    fetch: jest.fn()
  };
  return { pile, provider: () => globals };
}

describe('card handlers — flags that automation modules run', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>)['game'] = { release: { generation: 14 } };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('create-card refuses a carrier in flags without the opt-in and creates it with the opt-in', async () => {
    const params = { stackId: 'pile', name: 'Joker', flags: { 'midi-qol': { onUseMacroName: 'Boom' } } };

    const off = world();
    await expect(
      createCreateCardHandler({ globals: off.provider, scripts: { allowsScripts: () => false } })(params)
    ).rejects.toThrow(
      'Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    expect(off.pile.createEmbeddedDocuments).not.toHaveBeenCalled();

    const on = world();
    await createCreateCardHandler({ globals: on.provider, scripts: { allowsScripts: () => true } })(params);
    expect(on.pile.createEmbeddedDocuments).toHaveBeenCalled();
  });

  it('update-card keeps the stored carrier editable and refuses a changed one', async () => {
    const { pile, provider } = world();
    const update = createUpdateCardHandler({ globals: provider, scripts: { allowsScripts: () => false } });

    await update({ stackId: 'pile', cardId: 'fool', name: 'Fool', flags: { 'midi-qol': { onUseMacroName: 'Kept' } } });
    await expect(
      update({ stackId: 'pile', cardId: 'fool', flags: { 'midi-qol': { onUseMacroName: 'Other' } } })
    ).rejects.toThrow('Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro.');
    expect(pile.cards.get('fool')?.update).toHaveBeenCalledTimes(1);
  });
});
