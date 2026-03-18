import type { WorldData, CompendiumData } from '@/types/foundry';

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

  async sendWorldData(endpoint: string, data: WorldData): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to send world data: ${response.statusText}`);
    }
  }

  async sendCompendium(endpoint: string, packId: string, data: CompendiumData): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ packId, data })
    });

    if (!response.ok) {
      throw new Error(`Failed to send compendium ${packId}: ${response.statusText}`);
    }
  }
}
