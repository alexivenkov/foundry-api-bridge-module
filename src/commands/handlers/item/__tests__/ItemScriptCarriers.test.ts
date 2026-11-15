import type { ItemSystemData } from '../../../types';
import type { ItemGameProvider } from '../../../../core/items';
import { createAddItemToActorHandler } from '../AddItemToActorHandler';
import { createCreateItemHandler } from '../CreateItemHandler';
import { createUpdateActorItemHandler } from '../UpdateActorItemHandler';
import { createUpdateItemHandler } from '../UpdateItemHandler';

function provider(game: unknown): ItemGameProvider {
  return { getGame: () => game } as unknown as ItemGameProvider;
}

const ACTIVITY_MACRO = { activities: { act1: { macroData: { name: 'Blast', command: 'return 1' } } } };
// The owned-item wire type lists dnd5e fields only; the core passes any system data through.
const OWNED_ACTIVITY_MACRO = ACTIVITY_MACRO as ItemSystemData;

function world(): { game: unknown; createWorldItem: jest.Mock; updateWorldItem: jest.Mock; createOwned: jest.Mock; updateOwned: jest.Mock } {
  const createWorldItem = jest.fn().mockResolvedValue({ id: 'new', uuid: 'Item.new', name: 'Wand', type: 'weapon', img: null, folder: null });
  const updateWorldItem = jest.fn().mockResolvedValue(undefined);
  const blade = {
    id: 'blade',
    uuid: 'Item.blade',
    name: 'Blade',
    type: 'weapon',
    img: null,
    folder: null,
    toObject: () => ({ system: ACTIVITY_MACRO }),
    update: updateWorldItem,
    delete: jest.fn()
  };
  const sword = { id: 'sword', name: 'Sword', type: 'weapon', img: null, system: {}, _source: { system: ACTIVITY_MACRO } };
  const createOwned = jest.fn().mockResolvedValue([{ id: 'added', name: 'Wand', type: 'weapon', img: null }]);
  const updateOwned = jest.fn().mockResolvedValue([sword]);
  const hero = {
    id: 'a1',
    name: 'Hero',
    items: { contents: [sword], get: (id: string) => (id === 'sword' ? sword : undefined) },
    createEmbeddedDocuments: createOwned,
    updateEmbeddedDocuments: updateOwned
  };
  const game = {
    items: {
      get: (id: string) => (id === 'blade' ? blade : undefined),
      forEach: (fn: (item: unknown) => void) => fn(blade),
      documentClass: { create: createWorldItem }
    },
    actors: { get: (id: string) => (id === 'a1' ? hero : undefined) }
  };
  return { game, createWorldItem, updateWorldItem, createOwned, updateOwned };
}

const DENY = { allowsScripts: () => false };
const ALLOW = { allowsScripts: () => true };

describe('item handlers — system data that automation modules run', () => {
  it('create-item and add-item-to-actor refuse a Midi activity macro without the opt-in', async () => {
    const { game, createWorldItem, createOwned } = world();
    const deps = { gameProvider: provider(game), scripts: DENY };
    const refusal =
      'Script macros are disabled: system.activities.act1.macroData.command makes Midi-QOL run a macro. ' +
      'Enable "Allow Script Macros" in module settings to write it via API.';

    await expect(createCreateItemHandler(deps)({ name: 'Wand', type: 'weapon', system: ACTIVITY_MACRO })).rejects.toThrow(refusal);
    await expect(
      createAddItemToActorHandler(deps)({ actorId: 'a1', name: 'Wand', type: 'weapon', system: OWNED_ACTIVITY_MACRO })
    ).rejects.toThrow(refusal);
    expect(createWorldItem).not.toHaveBeenCalled();
    expect(createOwned).not.toHaveBeenCalled();
  });

  it('create-item and add-item-to-actor write it with the opt-in', async () => {
    const { game, createWorldItem, createOwned } = world();
    const deps = { gameProvider: provider(game), scripts: ALLOW };

    await createCreateItemHandler(deps)({ name: 'Wand', type: 'weapon', system: ACTIVITY_MACRO });
    await createAddItemToActorHandler(deps)({ actorId: 'a1', name: 'Wand', type: 'weapon', system: OWNED_ACTIVITY_MACRO });

    expect(createWorldItem).toHaveBeenCalled();
    expect(createOwned).toHaveBeenCalled();
  });

  it('update-item and update-actor-item keep a configured item editable and refuse a changed macro', async () => {
    const { game, updateWorldItem, updateOwned } = world();
    const deps = { gameProvider: provider(game), scripts: DENY };

    await createUpdateItemHandler(deps)({ itemId: 'blade', system: ACTIVITY_MACRO });
    await createUpdateActorItemHandler(deps)({ actorId: 'a1', itemId: 'sword', system: OWNED_ACTIVITY_MACRO });
    expect(updateWorldItem).toHaveBeenCalledTimes(1);
    expect(updateOwned).toHaveBeenCalledTimes(1);

    await expect(
      createUpdateActorItemHandler(deps)({
        actorId: 'a1',
        itemId: 'sword',
        system: { activities: { act1: { macroData: { command: 'return 2' } } } } as ItemSystemData
      })
    ).rejects.toThrow('Script macros are disabled: system.activities.act1.macroData.command makes Midi-QOL run a macro.');
    expect(updateOwned).toHaveBeenCalledTimes(1);
  });
});
