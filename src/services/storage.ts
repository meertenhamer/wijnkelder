import type { Wine, WineLocation } from '../types/wine';

export type AiProvider = 'openai' | 'claude';

export interface Me {
  email: string;
  aiProvider: AiProvider;
  hasOpenAI: boolean;
  hasClaude: boolean;
}

export class NotLoggedInError extends Error {}

// Gedeelde fetch-helper voor de Wijnkelder API (Cloudflare Worker op /api)
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
    // Verlopen Access-sessie: Access stuurt dan een redirect naar het loginscherm
    redirect: 'manual',
  });

  if (response.status === 401 || response.type === 'opaqueredirect') {
    throw new NotLoggedInError('Niet ingelogd');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data as { error?: string } | null)?.error || `Serverfout (${response.status})`);
  }
  return data as T;
}

let cachedAiProvider: AiProvider = 'openai';

type WineInput = Omit<Wine, 'id' | 'createdAt'>;

function toInput(wine: Wine | WineInput): WineInput {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...rest } = wine as Wine;
  return rest;
}

export const storage = {
  async getMe(): Promise<Me> {
    const me = await api<Me>('/me');
    cachedAiProvider = me.aiProvider;
    return me;
  },

  async getWines(): Promise<Wine[]> {
    try {
      return await api<Wine[]>('/wines');
    } catch (error) {
      console.error('Error fetching wines:', error);
      return [];
    }
  },

  async saveWine(wine: WineInput): Promise<Wine | null> {
    try {
      return await api<Wine>('/wines', { method: 'POST', body: toInput(wine) });
    } catch (error) {
      console.error('Error saving wine:', error);
      return null;
    }
  },

  async updateWine(wine: Wine): Promise<boolean> {
    try {
      await api(`/wines/${encodeURIComponent(wine.id)}`, { method: 'PUT', body: toInput(wine) });
      return true;
    } catch (error) {
      console.error('Error updating wine:', error);
      return false;
    }
  },

  async deleteWine(id: string): Promise<boolean> {
    try {
      await api(`/wines/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error deleting wine:', error);
      return false;
    }
  },

  /** Laat Claude de prijs per fles opzoeken; geeft de bijgewerkte wijn terug */
  async lookupPrice(id: string): Promise<Wine> {
    return api<Wine>(`/wines/${encodeURIComponent(id)}/price`, { method: 'POST' });
  },

  // --- Locaties ---

  async getLocations(): Promise<WineLocation[]> {
    try {
      return await api<WineLocation[]>('/locations');
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },

  async addLocation(name: string): Promise<WineLocation | null> {
    try {
      return await api<WineLocation>('/locations', { method: 'POST', body: { name: name.trim() } });
    } catch (error) {
      console.error('Error adding location:', error);
      return null;
    }
  },

  async deleteLocation(id: string): Promise<boolean> {
    try {
      await api(`/locations/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      return false;
    }
  },

  // --- Instellingen ---

  getAiProvider(): AiProvider {
    return cachedAiProvider;
  },

  async saveAiProvider(aiProvider: AiProvider): Promise<boolean> {
    try {
      await api('/settings', { method: 'PUT', body: { aiProvider } });
      cachedAiProvider = aiProvider;
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
};
