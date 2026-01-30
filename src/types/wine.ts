export type WineType = 'rood' | 'wit' | 'rosé' | 'bruisend';

export interface Wine {
  id: string;

  // Handmatig ingevoerd
  name: string;
  year: number;
  grapes?: string;
  quantity: number;

  // AI-gegenereerd
  country?: string;
  region?: string;
  type: WineType;
  bestBefore?: string;
  tasteProfile?: string;
  pairingAdvice?: string;

  // Gebruikersfeedback
  notes?: string;
  rating?: 1 | 2 | 3 | 4 | 5;

  createdAt: string;
}

export interface WineFormData {
  name: string;
  year: number;
  grapes?: string;
  quantity: number;
  notes?: string;
}
