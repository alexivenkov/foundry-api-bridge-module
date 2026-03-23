import { ApiClient, ApiError } from '@/api/ApiClient';
import type { WorldData, CompendiumData } from '@/types/foundry';

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
          body: JSON.stringify(mockWorldData),
          signal: null
        }
      );
    });

    it('throws ApiError with status when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

      await expect(client.sendWorldData('/update', mockWorldData)).rejects.toThrow(ApiError);

      try {
        await client.sendWorldData('/update', mockWorldData);
      } catch (error) {
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).message).toBe('Failed to send world data: Internal Server Error');
      }
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.sendWorldData('/update', mockWorldData))
        .rejects.toThrow('Network error');
    });

    it('passes AbortSignal to fetch', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const controller = new AbortController();

      await client.sendWorldData('/update', mockWorldData, controller.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/update',
        expect.objectContaining({ signal: controller.signal })
      );
    });
  });

  describe('authorization header', () => {
    it('should include Authorization header when apiKey is provided', async () => {
      const clientWithKey = new ApiClient('http://localhost:3001', 'pk_test123');
      mockFetch.mockResolvedValue({ ok: true });

      const mockWorldData: WorldData = {
        world: { id: 'test', title: 'Test', system: 'dnd5e', systemVersion: '3.0.0', foundryVersion: '12' },
        counts: { journals: 0, actors: 0, items: 0, scenes: 0 },
        journals: [], actors: [], scenes: [], items: [], compendiumMeta: []
      };

      await clientWithKey.sendWorldData('/update', mockWorldData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/update',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer pk_test123'
          }
        })
      );
    });

    it('should include Authorization header for sendCompendium when apiKey is provided', async () => {
      const clientWithKey = new ApiClient('http://localhost:3001', 'pk_test123');
      mockFetch.mockResolvedValue({ ok: true });

      const mockCompendiumData: CompendiumData = {
        id: 'dnd5e.monsters', label: 'Monsters', type: 'Actor',
        system: 'dnd5e', documentCount: 0, documents: []
      };

      await clientWithKey.sendCompendium('/update-compendium', 'dnd5e.monsters', mockCompendiumData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/update-compendium',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer pk_test123'
          }
        })
      );
    });

    it('should not include Authorization header when apiKey is empty', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const mockWorldData: WorldData = {
        world: { id: 'test', title: 'Test', system: 'dnd5e', systemVersion: '3.0.0', foundryVersion: '12' },
        counts: { journals: 0, actors: 0, items: 0, scenes: 0 },
        journals: [], actors: [], scenes: [], items: [], compendiumMeta: []
      };

      await client.sendWorldData('/update', mockWorldData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/update',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
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
          }),
          signal: null
        }
      );
    });

    it('throws ApiError with status when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });

      await expect(client.sendCompendium('/update-compendium', 'dnd5e.monsters', mockCompendiumData))
        .rejects.toThrow(ApiError);
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(client.sendCompendium('/update-compendium', 'dnd5e.monsters', mockCompendiumData))
        .rejects.toThrow('Connection refused');
    });
  });

  describe('getSession', () => {
    it('returns session info on success', async () => {
      const clientWithKey = new ApiClient('http://localhost:3001', 'pk_test');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          tier: 'adventurer',
          features: { compendiums: true, commands: ['roll-dice'] }
        })
      });

      const session = await clientWithKey.getSession();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/session',
        { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer pk_test' } }
      );
      expect(session.tier).toBe('adventurer');
      expect(session.features.compendiums).toBe(true);
    });

    it('returns fallback on 401', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 });

      const session = await client.getSession();

      expect(session.tier).toBe('unknown');
      expect(session.features.compendiums).toBe(false);
      expect(session.features.commands).toEqual([]);
    });

    it('returns fallback on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const session = await client.getSession();

      expect(session.tier).toBe('unknown');
      expect(session.features.compendiums).toBe(false);
    });

    it('returns fallback on 500', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const session = await client.getSession();

      expect(session.tier).toBe('unknown');
      expect(session.features.compendiums).toBe(false);
    });

    it('returns fallback when response has no features field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tier: 'free' })
      });

      const session = await client.getSession();

      expect(session.tier).toBe('free');
      expect(session.features.compendiums).toBe(false);
      expect(session.features.commands).toEqual([]);
    });

    it('returns fallback when response has no tier field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: { compendiums: true } })
      });

      const session = await client.getSession();

      expect(session.tier).toBe('unknown');
      expect(session.features.compendiums).toBe(true);
    });

    it('returns fallback when response is empty object', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      const session = await client.getSession();

      expect(session.tier).toBe('unknown');
      expect(session.features.compendiums).toBe(false);
      expect(session.features.commands).toEqual([]);
    });

    it('returns fallback when features.compendiums is not boolean', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tier: 'dm', features: { compendiums: 'yes', commands: [] } })
      });

      const session = await client.getSession();

      expect(session.features.compendiums).toBe(false);
    });

    it('filters non-string values from commands array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          tier: 'dm',
          features: { compendiums: true, commands: ['roll-dice', 123, null, 'get-combat-state'] }
        })
      });

      const session = await client.getSession();

      expect(session.features.commands).toEqual(['roll-dice', 'get-combat-state']);
    });

    it('handles features.commands not being an array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          tier: 'adventurer',
          features: { compendiums: true, commands: 'not-array' }
        })
      });

      const session = await client.getSession();

      expect(session.features.commands).toEqual([]);
    });

    it('returns fallback when json() throws', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const session = await client.getSession();

      expect(session.tier).toBe('unknown');
      expect(session.features.compendiums).toBe(false);
    });

    it('returns free tier session correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          tier: 'free',
          features: { compendiums: false, commands: ['get-combat-state'] }
        })
      });

      const session = await client.getSession();

      expect(session.tier).toBe('free');
      expect(session.features.compendiums).toBe(false);
      expect(session.features.commands).toEqual(['get-combat-state']);
    });
  });

  describe('ApiError', () => {
    it('has correct name and status', () => {
      const error = new ApiError('test', 429);
      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(429);
      expect(error.message).toBe('test');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
