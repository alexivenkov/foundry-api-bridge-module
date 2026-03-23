import type { WorldData, CompendiumData } from '@/types/foundry';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private baseUrl: string, private apiKey: string = '') {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async sendWorldData(endpoint: string, data: WorldData, signal?: AbortSignal): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      signal: signal ?? null
    });

    if (!response.ok) {
      throw new ApiError(`Failed to send world data: ${response.statusText}`, response.status);
    }
  }

  async sendCompendium(endpoint: string, packId: string, data: CompendiumData, signal?: AbortSignal): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ packId, data }),
      signal: signal ?? null
    });

    if (!response.ok) {
      throw new ApiError(`Failed to send compendium ${packId}: ${response.statusText}`, response.status);
    }
  }
}
