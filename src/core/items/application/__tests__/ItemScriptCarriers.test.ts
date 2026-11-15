import type { ActorRef, ActorTarget } from '../../../shared';
import { ItemNotFoundError, type OwnedItemSources, type ScriptCarrierPolicy, type SystemData } from '../../domain';
import { ActorItemService } from '../ActorItemService';
import { WorldItemService } from '../WorldItemService';
import { FakeActorInventory, FakeWorld, FakeWorldItemStore, inventoryItem, worldItem } from './fakePorts';

const hero: ActorTarget = { kind: 'actor', actorId: 'a1' };
const MIDI_ACTIVITY = { activities: { act1: { useConditionText: 'target.details.cr > 2', macroData: { name: '', command: 'return 1' } } } };

function policy(allows: boolean | undefined): ScriptCarrierPolicy | undefined {
  return allows === undefined ? undefined : { allowsScripts: () => allows };
}

function worldItems(allows: boolean | undefined): { service: WorldItemService; items: FakeWorldItemStore } {
  const items = new FakeWorldItemStore([worldItem({ id: 'blade', name: 'Blade', system: MIDI_ACTIVITY })]);
  return { service: new WorldItemService({ items, scripts: policy(allows) }), items };
}

class FakeSources implements OwnedItemSources {
  constructor(private readonly systems: Readonly<Record<string, SystemData>>) {}

  storedSystem(_actor: ActorRef, itemId: string): SystemData | null {
    return this.systems[itemId] ?? null;
  }
}

function ownedItems(allows: boolean, sources?: OwnedItemSources): { service: ActorItemService; inventory: FakeActorInventory } {
  const inventory = new FakeActorInventory({ 'world:a1': { id: 'a1', name: 'Hero' } }, { 'world:a1': [inventoryItem({ id: 'sword' })] });
  const world = new FakeWorld([{ id: 'a1', name: 'Hero' }]);
  return {
    service: new ActorItemService({ scenes: world, actors: world, inventory, scripts: policy(allows), sources }),
    inventory
  };
}

describe('WorldItemService — item data that automation modules run', () => {
  it('refuses a Midi activity macro or condition without the opt-in, or without a policy at all', async () => {
    for (const allows of [false, undefined]) {
      const { service, items } = worldItems(allows);
      await expect(
        service.createItem({ draft: { name: 'Wand', type: 'weapon', system: { activities: { a: { macroData: { command: 'x' } } } } } })
      ).rejects.toThrow('Script macros are disabled: system.activities.a.macroData.command makes Midi-QOL run a macro.');
      expect(items.created).toEqual([]);
    }
  });

  it('refuses dae.eval in any system formula', async () => {
    const { service } = worldItems(false);

    await expect(
      service.updateItem({ itemId: 'blade', changes: { system: { damage: { base: { bonus: 'dae.eval(1)' } } } } })
    ).rejects.toThrow('Script macros are disabled: system.damage.base.bonus makes DAE run JavaScript.');
  });

  it('writes carriers with the opt-in and ordinary system data without it', async () => {
    const allowed = worldItems(true);
    await allowed.service.createItem({ draft: { name: 'Wand', type: 'weapon', system: MIDI_ACTIVITY } });
    expect(allowed.items.created).toHaveLength(1);

    const plain = worldItems(false);
    await plain.service.createItem({ draft: { name: 'Club', type: 'weapon', system: { damage: { base: { number: 1, denomination: 6 } } } } });
    await plain.service.updateItem({ itemId: 'blade', changes: { name: 'Sharp Blade' } });
    expect(plain.items.created).toHaveLength(1);
    expect(plain.items.updated).toHaveLength(1);
  });

  it('keeps a configured item editable when its system data comes back unchanged', async () => {
    const { service, items } = worldItems(false);

    await service.updateItem({ itemId: 'blade', changes: { system: { ...MIDI_ACTIVITY, rarity: 'rare' } } });
    await expect(
      service.updateItem({ itemId: 'blade', changes: { system: { 'activities.act1.useConditionText': 'true || x()' } } })
    ).rejects.toThrow('Script macros are disabled: system.activities.act1.useConditionText makes Midi-QOL run JavaScript.');
    expect(items.updated).toHaveLength(1);
  });

  it('reports a missing item first when the write carries something', async () => {
    const { service } = worldItems(false);

    await expect(
      service.updateItem({ itemId: 'gone', changes: { system: MIDI_ACTIVITY } })
    ).rejects.toThrow(ItemNotFoundError);
  });
});

describe('ActorItemService — item data that automation modules run', () => {
  it('refuses a carrier in an added item without the opt-in and adds it with the opt-in', async () => {
    const draft = { name: 'Wand', type: 'weapon', system: MIDI_ACTIVITY };

    const off = ownedItems(false);
    await expect(off.service.addItem({ target: hero, draft })).rejects.toThrow(
      'Script macros are disabled: system.activities.act1.useConditionText makes Midi-QOL run JavaScript.'
    );
    expect(off.inventory.added).toEqual([]);

    const on = ownedItems(true);
    await on.service.addItem({ target: hero, draft });
    expect(on.inventory.added).toHaveLength(1);
  });

  it('compares an update with the stored system data when it can read it', async () => {
    const stored = new FakeSources({ sword: MIDI_ACTIVITY });
    const withSources = ownedItems(false, stored);
    await withSources.service.updateItem({ target: hero, itemId: 'sword', changes: { system: MIDI_ACTIVITY } });
    expect(withSources.inventory.updated).toHaveLength(1);

    const blind = ownedItems(false);
    await expect(
      blind.service.updateItem({ target: hero, itemId: 'sword', changes: { system: MIDI_ACTIVITY } })
    ).rejects.toThrow('Script macros are disabled');
    expect(blind.inventory.updated).toEqual([]);
  });
});
