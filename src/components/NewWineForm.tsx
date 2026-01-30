import { useState, useEffect } from 'react';
import type { Wine, WineFormData } from '../types/wine';
import { storage } from '../services/storage';
import { fetchWineInfo } from '../services/openai';

interface NewWineFormProps {
  onBack: () => void;
  onSave: (wine: Wine) => void;
}

export function NewWineForm({ onBack, onSave }: NewWineFormProps) {
  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    year: new Date().getFullYear(),
    grapes: '',
    quantity: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(storage.getApiKey() || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!storage.getApiKey());

  useEffect(() => {
    if (apiKey) {
      storage.setApiKey(apiKey);
    }
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Vul een wijnnaam in');
      return;
    }

    if (!apiKey) {
      setError('Vul je OpenAI API key in');
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);

    try {
      const wineInfo = await fetchWineInfo(
        formData.name,
        formData.year,
        formData.grapes || undefined
      );

      const wineData = {
        name: formData.name,
        year: formData.year,
        grapes: formData.grapes || wineInfo.grapes,
        quantity: formData.quantity,
        country: wineInfo.country,
        region: wineInfo.region,
        type: wineInfo.type,
        bestBefore: wineInfo.bestBefore,
        tasteProfile: wineInfo.tasteProfile,
        pairingAdvice: wineInfo.pairingAdvice,
      };

      const savedWine = await storage.saveWine(wineData);
      if (savedWine) {
        onSave(savedWine);
      } else {
        setError('Kon wijn niet opslaan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="text-stone-600 hover:text-stone-800 mb-6 flex items-center gap-2"
        >
          <span>←</span> Terug
        </button>

        <h1 className="text-3xl font-bold text-stone-800 mb-8">Nieuwe Wijn</h1>

        {showApiKeyInput && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-stone-200 shadow-sm">
            <label className="block text-stone-700 text-sm font-medium mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="sk-..."
            />
            <p className="text-stone-500 text-xs mt-2">
              Je key wordt lokaal opgeslagen en nooit gedeeld
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            <div>
              <label className="block text-stone-700 text-sm font-medium mb-2">
                Naam *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
                placeholder="bijv. Château Margaux"
              />
            </div>

            <div>
              <label className="block text-stone-700 text-sm font-medium mb-2">
                Jaar *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-stone-700 text-sm font-medium mb-2">
                Druiven <span className="text-stone-400">(optioneel)</span>
              </label>
              <input
                type="text"
                value={formData.grapes}
                onChange={(e) => setFormData({ ...formData, grapes: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
                placeholder="bijv. Cabernet Sauvignon"
              />
            </div>

            <div>
              <label className="block text-stone-700 text-sm font-medium mb-2">
                Aantal flessen *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
                min="1"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Wijn informatie ophalen...
              </span>
            ) : (
              'Toevoegen'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
