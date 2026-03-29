import type { Wine } from '../types/wine';
import { supabase } from './supabase';

const API_KEY_KEY = 'wijnkelder_openai_key';

export type AiProvider = 'openai' | 'claude';

// Cache voor API keys (om niet steeds database te hoeven raadplegen)
let cachedApiKey: string | null = null;
let cachedClaudeApiKey: string | null = null;
let cachedAiProvider: AiProvider = 'openai';

// Database wine type (snake_case from Supabase)
interface DbWine {
  id: string;
  user_id: string;
  name: string;
  year: number;
  grapes: string | null;
  quantity: number;
  country: string | null;
  region: string | null;
  type: string;
  best_before: string | null;
  taste_profile: string | null;
  pairing_advice: string | null;
  fun_fact: string | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
}

// Convert database wine to app wine
function dbToWine(dbWine: DbWine): Wine {
  return {
    id: dbWine.id,
    name: dbWine.name,
    year: dbWine.year,
    grapes: dbWine.grapes || undefined,
    quantity: dbWine.quantity,
    country: dbWine.country || undefined,
    region: dbWine.region || undefined,
    type: dbWine.type as Wine['type'],
    bestBefore: dbWine.best_before || undefined,
    tasteProfile: dbWine.taste_profile || undefined,
    pairingAdvice: dbWine.pairing_advice || undefined,
    funFact: dbWine.fun_fact || undefined,
    notes: dbWine.notes || undefined,
    rating: dbWine.rating as Wine['rating'],
    createdAt: dbWine.created_at,
  };
}

// Convert app wine to database format
function wineToDb(wine: Omit<Wine, 'id' | 'createdAt'>, userId: string) {
  return {
    user_id: userId,
    name: wine.name,
    year: wine.year,
    grapes: wine.grapes || null,
    quantity: wine.quantity,
    country: wine.country || null,
    region: wine.region || null,
    type: wine.type,
    best_before: wine.bestBefore || null,
    taste_profile: wine.tasteProfile || null,
    pairing_advice: wine.pairingAdvice || null,
    fun_fact: wine.funFact || null,
    notes: wine.notes || null,
    rating: wine.rating || null,
  };
}

export const storage = {
  async getWines(): Promise<Wine[]> {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wines:', error);
      return [];
    }

    return (data as DbWine[]).map(dbToWine);
  },

  async saveWine(wine: Omit<Wine, 'id' | 'createdAt'>): Promise<Wine | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('wines')
      .insert(wineToDb(wine, user.id))
      .select()
      .single();

    if (error) {
      console.error('Error saving wine:', error);
      return null;
    }

    return dbToWine(data as DbWine);
  },

  async updateWine(wine: Wine): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('wines')
      .update({
        name: wine.name,
        year: wine.year,
        grapes: wine.grapes || null,
        quantity: wine.quantity,
        country: wine.country || null,
        region: wine.region || null,
        type: wine.type,
        best_before: wine.bestBefore || null,
        taste_profile: wine.tasteProfile || null,
        pairing_advice: wine.pairingAdvice || null,
        fun_fact: wine.funFact || null,
        notes: wine.notes || null,
        rating: wine.rating || null,
      })
      .eq('id', wine.id);

    if (error) {
      console.error('Error updating wine:', error);
      return false;
    }

    return true;
  },

  async deleteWine(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wine:', error);
      return false;
    }

    return true;
  },

  // Haal API key op - eerst uit cache, dan uit Supabase
  getApiKey(): string | null {
    return cachedApiKey;
  },

  getClaudeApiKey(): string | null {
    return cachedClaudeApiKey;
  },

  getAiProvider(): AiProvider {
    return cachedAiProvider;
  },

  // Laad alle API instellingen van Supabase
  async loadApiKey(): Promise<string | null> {
    // Check eerst localStorage voor backwards compatibility
    const localKey = localStorage.getItem(API_KEY_KEY);
    if (localKey) {
      cachedApiKey = localKey;
      // Migreer naar Supabase
      await this.saveSettings({ openaiApiKey: localKey });
      localStorage.removeItem(API_KEY_KEY);
      return localKey;
    }

    // Haal op van Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('openai_api_key, claude_api_key, ai_provider')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    cachedApiKey = data.openai_api_key || null;
    cachedClaudeApiKey = data.claude_api_key || null;
    cachedAiProvider = (data.ai_provider as AiProvider) || 'openai';
    return cachedApiKey;
  },

  // Sla instellingen op in Supabase
  async saveSettings(settings: {
    openaiApiKey?: string;
    claudeApiKey?: string;
    aiProvider?: AiProvider;
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, string> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (settings.openaiApiKey !== undefined) {
      updateData.openai_api_key = settings.openaiApiKey;
      cachedApiKey = settings.openaiApiKey;
    }
    if (settings.claudeApiKey !== undefined) {
      updateData.claude_api_key = settings.claudeApiKey;
      cachedClaudeApiKey = settings.claudeApiKey;
    }
    if (settings.aiProvider !== undefined) {
      updateData.ai_provider = settings.aiProvider;
      cachedAiProvider = settings.aiProvider;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(updateData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving settings:', error);
      return false;
    }

    return true;
  },

  setApiKey(key: string): void {
    cachedApiKey = key;
    this.saveSettings({ openaiApiKey: key });
  },

  clearApiKey(): void {
    cachedApiKey = null;
  }
};
