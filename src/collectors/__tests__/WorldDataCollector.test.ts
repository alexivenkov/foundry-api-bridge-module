import { WorldDataCollector } from '../WorldDataCollector';

const mockGame = {
  world: {
    id: 'test-world',
    title: 'Test World'
  },
  system: {
    id: 'dnd5e',
    version: '3.0.0'
  },
  version: '12',
  journal: new Map([
    ['journal1', {
      id: 'journal1',
      uuid: 'JournalEntry.journal1',
      name: 'Test Journal',
      folder: { name: 'Test Folder' },
      pages: new Map([
        ['page1', {
          id: 'page1',
          name: 'Page 1',
          type: 'text',
          text: { content: '<p>Content</p>', markdown: null }
        }]
      ])
    }]
  ]),
  actors: new Map([
    ['actor1', {
      id: 'actor1',
      uuid: 'Actor.actor1',
      name: 'Test Actor',
      type: 'npc',
      folder: null,
      img: 'actor.png',
      system: { hp: 10 },
      items: new Map([
        ['item1', {
          id: 'item1',
          name: 'Sword',
          type: 'weapon',
          img: 'sword.png',
          system: { damage: '1d8' },
          toObject: () => ({ system: { damage: '1d8' } })
        }]
      ]),
      getRollData: () => ({ hp: 10 })
    }]
  ]),
  scenes: new Map([
    ['scene1', {
      id: 'scene1',
      uuid: 'Scene.scene1',
      name: 'Test Scene',
      active: true,
      folder: null,
      img: 'scene.jpg',
      width: 4000,
      height: 3000
    }]
  ]),
  items: new Map([
    ['item2', {
      id: 'item2',
      uuid: 'Item.item2',
      name: 'Potion',
      type: 'consumable',
      img: 'potion.png',
      folder: { name: 'Items' },
      system: { uses: 1 },
      toObject: () => ({ system: { uses: 1 } })
    }]
  ]),
  packs: new Map([
    ['dnd5e.monsters', {
      collection: 'dnd5e.monsters',
      metadata: {
        label: 'Monsters',
        type: 'Actor',
        system: 'dnd5e',
        packageName: 'dnd5e'
      },
      index: { size: 331 }
    }]
  ])
};

describe('WorldDataCollector', () => {
  let collector: WorldDataCollector;

  beforeEach(() => {
    (global as Record<string, unknown>)['game'] = mockGame;
    collector = new WorldDataCollector();
  });

  afterEach(() => {
    delete (global as Record<string, unknown>)['game'];
  });

  it('collects world info', () => {
    const data = collector.collect();

    expect(data.world).toEqual({
      id: 'test-world',
      title: 'Test World',
      system: 'dnd5e',
      systemVersion: '3.0.0',
      foundryVersion: '12'
    });
  });

  it('collects counts', () => {
    const data = collector.collect();

    expect(data.counts).toEqual({
      journals: 1,
      actors: 1,
      items: 1,
      scenes: 1
    });
  });

  it('collects journals with pages', () => {
    const data = collector.collect();

    expect(data.journals).toHaveLength(1);
    expect(data.journals[0]).toEqual({
      id: 'journal1',
      uuid: 'JournalEntry.journal1',
      name: 'Test Journal',
      folder: 'Test Folder',
      pages: [{
        id: 'page1',
        name: 'Page 1',
        type: 'text',
        text: '<p>Content</p>',
        markdown: null
      }]
    });
  });

  it('collects actors with items', () => {
    const data = collector.collect();

    expect(data.actors).toHaveLength(1);
    expect(data.actors[0]).toEqual({
      id: 'actor1',
      uuid: 'Actor.actor1',
      name: 'Test Actor',
      type: 'npc',
      folder: null,
      img: 'actor.png',
      system: { hp: 10 },
      items: [{
        id: 'item1',
        name: 'Sword',
        type: 'weapon',
        img: 'sword.png',
        system: { damage: '1d8' }
      }]
    });
  });

  it('collects scenes', () => {
    const data = collector.collect();

    expect(data.scenes).toHaveLength(1);
    expect(data.scenes[0]).toEqual({
      id: 'scene1',
      uuid: 'Scene.scene1',
      name: 'Test Scene',
      active: true,
      folder: null,
      img: 'scene.jpg',
      width: 4000,
      height: 3000
    });
  });

  it('collects global items', () => {
    const data = collector.collect();

    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toEqual({
      id: 'item2',
      uuid: 'Item.item2',
      name: 'Potion',
      type: 'consumable',
      img: 'potion.png',
      folder: 'Items',
      system: { uses: 1 }
    });
  });

  it('collects compendium metadata', () => {
    const data = collector.collect();

    expect(data.compendiumMeta).toHaveLength(1);
    expect(data.compendiumMeta[0]).toEqual({
      id: 'dnd5e.monsters',
      label: 'Monsters',
      type: 'Actor',
      system: 'dnd5e',
      packageName: 'dnd5e',
      documentCount: 331
    });
  });

  it('handles empty collections', () => {
    (global as Record<string, unknown>)['game'] = {
      world: mockGame.world,
      system: mockGame.system,
      version: mockGame.version,
      journal: new Map(),
      actors: new Map(),
      scenes: new Map(),
      items: new Map(),
      packs: new Map()
    };

    const data = collector.collect();

    expect(data.journals).toHaveLength(0);
    expect(data.actors).toHaveLength(0);
    expect(data.scenes).toHaveLength(0);
    expect(data.items).toHaveLength(0);
    expect(data.compendiumMeta).toHaveLength(0);
  });
});
