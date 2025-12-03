import { loadConfigFromUrl } from '@/config/loader';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

describe('loadConfigFromUrl', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('loads and parses valid JSON config', async () => {
    const mockConfig = { apiServer: { url: 'http://localhost:3001' } };
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockConfig)
    });

    const result = await loadConfigFromUrl('config.json');

    expect(result).toEqual(mockConfig);
    expect(mockFetch).toHaveBeenCalledWith('config.json');
  });

  it('throws error when fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found'
    });

    await expect(loadConfigFromUrl('missing.json'))
      .rejects.toThrow('Failed to load config from missing.json: Not Found');
  });

  it('throws error when JSON is invalid', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => 'invalid json {'
    });

    await expect(loadConfigFromUrl('bad.json'))
      .rejects.toThrow('Invalid JSON in config file');
  });

  it('throws error when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(loadConfigFromUrl('config.json'))
      .rejects.toThrow('Network error');
  });
});
