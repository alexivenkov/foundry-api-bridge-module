import { ApiClient } from '../ApiClient';
import type { WorldData, CompendiumData } from '../../types/foundry';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:3001');
    mockFetch.mockReset();
  });

  describe('sendWorldData', () => {
    const mockWorldData: WorldData = {
      world: {
        id: 'test-world',
        title: 'Test World',
        system: 'dnd5e',
        systemVersion: '3.0.0',
        foundryVersion: '12'
      },
      counts: { journals: 0, actors: 0, items: 0, scenes: 0 },
      journals: [],
      actors: [],
      scenes: [],
      items: [],
      compendiumMeta: []
    };

    it('sends world data successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await client.sendWorldData('/update', mockWorldData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/update',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockWorldData)
        }
      );
    });

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Internal Server Error' });

      await expect(client.sendWorldData('/update', mockWorldData))
        .rejects.toThrow('Failed to send world data: Internal Server Error');
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.sendWorldData('/update', mockWorldData))
        .rejects.toThrow('Network error');
    });
  });

  describe('sendCompendium', () => {
    const mockCompendiumData: CompendiumData = {
      id: 'dnd5e.monsters',
      label: 'Monsters',
      type: 'Actor',
      system: 'dnd5e',
      documentCount: 10,
      documents: []
    };

    it('sends compendium data successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await client.sendCompendium('/update-compendium', 'dnd5e.monsters', mockCompendiumData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/update-compendium',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packId: 'dnd5e.monsters',
            data: mockCompendiumData
          })
        }
      );
    });

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Bad Request' });

      await expect(client.sendCompendium('/update-compendium', 'dnd5e.monsters', mockCompendiumData))
        .rejects.toThrow('Failed to send compendium dnd5e.monsters: Bad Request');
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(client.sendCompendium('/update-compendium', 'dnd5e.monsters', mockCompendiumData))
        .rejects.toThrow('Connection refused');
    });
  });
});
