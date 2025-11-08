import { CompendiumCollector } from '../CompendiumCollector';
import type { ApiClient } from '../../api/ApiClient';

const mockPack = {
  collection: 'dnd5e.monsters',
  metadata: {
    label: 'Monsters',
    type: 'Actor',
    system: 'dnd5e',
    packageName: 'dnd5e'
  },
  index: { size: 2 },
  getDocuments: jest.fn()
};

const mockGame = {
  packs: new Map([['dnd5e.monsters', mockPack]])
};

describe('CompendiumCollector', () => {
  let collector: CompendiumCollector;

  beforeEach(() => {
    (global as Record<string, unknown>)['game'] = mockGame;
    (global as Record<string, unknown>)['console'] = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    collector = new CompendiumCollector();
    mockPack.getDocuments.mockReset();
  });

  afterEach(() => {
    delete (global as Record<string, unknown>)['game'];
  });

  describe('collectMetadata', () => {
    it('collects metadata from all packs', () => {
      const metadata = collector.collectMetadata();

      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual({
        id: 'dnd5e.monsters',
        label: 'Monsters',
        type: 'Actor',
        system: 'dnd5e',
        packageName: 'dnd5e',
        documentCount: 2
      });
    });

    it('returns empty array when no packs', () => {
      (global as Record<string, unknown>)['game'] = { packs: new Map() };

      const metadata = collector.collectMetadata();

      expect(metadata).toHaveLength(0);
    });
  });

  describe('loadContents', () => {
    it('loads compendium contents successfully', async () => {
      mockPack.getDocuments.mockResolvedValue([
        {
          id: 'monster1',
          uuid: 'Actor.monster1',
          name: 'Goblin',
          type: 'npc',
          img: 'goblin.png',
          system: { hp: 7 },
          items: new Map([
            ['weapon1', {
              id: 'weapon1',
              name: 'Scimitar',
              type: 'weapon',
              img: 'scimitar.png',
              system: { damage: '1d6' }
            }]
          ]),
          pages: undefined
        }
      ]);

      const result = await collector.loadContents('dnd5e.monsters');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('dnd5e.monsters');
      expect(result?.documents).toHaveLength(1);
      expect(result?.documents[0]).toEqual({
        id: 'monster1',
        uuid: 'Actor.monster1',
        name: 'Goblin',
        type: 'npc',
        img: 'goblin.png',
        system: { hp: 7 },
        items: [{
          id: 'weapon1',
          name: 'Scimitar',
          type: 'weapon',
          img: 'scimitar.png',
          system: { damage: '1d6' }
        }]
      });
    });

    it('returns null when pack not found', async () => {
      const result = await collector.loadContents('invalid.pack');

      expect(result).toBeNull();
    });

    it('returns null when getDocuments fails', async () => {
      mockPack.getDocuments.mockRejectedValue(new Error('Load failed'));

      const result = await collector.loadContents('dnd5e.monsters');

      expect(result).toBeNull();
    });

    it('handles documents with pages', async () => {
      mockPack.getDocuments.mockResolvedValue([
        {
          id: 'journal1',
          uuid: 'JournalEntry.journal1',
          name: 'Lore',
          type: 'base',
          img: 'journal.png',
          system: undefined,
          items: undefined,
          pages: new Map([
            ['page1', {
              id: 'page1',
              name: 'Chapter 1',
              type: 'text',
              text: { content: 'Content', markdown: null }
            }]
          ])
        }
      ]);

      const result = await collector.loadContents('dnd5e.monsters');

      expect(result?.documents[0]?.pages).toEqual([{
        id: 'page1',
        name: 'Chapter 1',
        type: 'text',
        text: 'Content',
        markdown: null
      }]);
    });
  });

  describe('autoLoad', () => {
    let mockApiClient: jest.Mocked<ApiClient>;

    beforeEach(() => {
      mockApiClient = {
        sendCompendium: jest.fn().mockResolvedValue(undefined)
      } as unknown as jest.Mocked<ApiClient>;
    });

    it('loads and sends all configured packs', async () => {
      mockPack.getDocuments.mockResolvedValue([
        {
          id: 'doc1',
          uuid: 'Actor.doc1',
          name: 'Test',
          type: 'npc',
          img: 'test.png',
          system: {},
          items: undefined,
          pages: undefined
        }
      ]);

      await collector.autoLoad(['dnd5e.monsters'], mockApiClient, '/update-compendium');

      expect(mockApiClient.sendCompendium).toHaveBeenCalledWith(
        '/update-compendium',
        'dnd5e.monsters',
        expect.objectContaining({ id: 'dnd5e.monsters' })
      );
    });

    it('skips missing packs', async () => {
      await collector.autoLoad(['invalid.pack'], mockApiClient, '/update-compendium');

      expect(mockApiClient.sendCompendium).not.toHaveBeenCalled();
    });

    it('continues after error', async () => {
      mockPack.getDocuments.mockRejectedValue(new Error('Failed'));

      await collector.autoLoad(['dnd5e.monsters'], mockApiClient, '/update-compendium');

      expect(mockApiClient.sendCompendium).not.toHaveBeenCalled();
    });

    it('does nothing when pack list is empty', async () => {
      await collector.autoLoad([], mockApiClient, '/update-compendium');

      expect(mockApiClient.sendCompendium).not.toHaveBeenCalled();
    });
  });
});
