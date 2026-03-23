import type { WorldData, CompendiumData } from '@/types/foundry';

export interface SessionInfo {
  tier: string;
  features: {
    compendiums: boolean;
    commands: string[];
  };
}

const FALLBACK_SESSION: SessionInfo = {
  tier: 'unknown',
  features: { compendiums: false, commands: [] }
};

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

  async getSession(): Promise<SessionInfo> {
    try {
      const url = `${this.baseUrl}/api/session`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return FALLBACK_SESSION;
      }

      const data = await response.json() as Record<string, unknown>;
      return this.parseSession(data);
    } catch {
      return FALLBACK_SESSION;
    }
  }

  private parseSession(data: Record<string, unknown>): SessionInfo {
    const tier = typeof data['tier'] === 'string' ? data['tier'] : 'unknown';
    const features = typeof data['features'] === 'object' && data['features'] !== null
      ? data['features'] as Record<string, unknown>
      : {};

    return {
      tier,
      features: {
        compendiums: features['compendiums'] === true,
        commands: Array.isArray(features['commands'])
          ? (features['commands'] as unknown[]).filter((c): c is string => typeof c === 'string')
          : []
      }
    };
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
