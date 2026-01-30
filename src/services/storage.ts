import type { Wine } from '../types/wine';
import { supabase } from './supabase';

const API_KEY_KEY = 'wijnkelder_openai_key';

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

  getApiKey(): string | null {
    return localStorage.getItem(API_KEY_KEY);
  },

  setApiKey(key: string): void {
    localStorage.setItem(API_KEY_KEY, key);
  },

  clearApiKey(): void {
    localStorage.removeItem(API_KEY_KEY);
  }
};
