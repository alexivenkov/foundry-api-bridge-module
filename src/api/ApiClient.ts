import type { WorldData, CompendiumData } from '../types/foundry';

export class ApiClient {
  constructor(private baseUrl: string) {}

  async sendWorldData(endpoint: string, data: WorldData): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packId, data })
    });

    if (!response.ok) {
      throw new Error(`Failed to send compendium ${packId}: ${response.statusText}`);
    }
  }
}
