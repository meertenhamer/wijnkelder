import { useState } from 'react';
import type { Wine } from '../types/wine';
import { getFoodPairing } from '../services/openai';

interface FoodPairingProps {
  wines: Wine[];
  onBack: () => void;
}

interface Recommendation {
  wine: Wine;
  reason: string;
  score: number;
}

export function FoodPairing({ wines, onBack }: FoodPairingProps) {
  const [dish, setDish] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [generalAdvice, setGeneralAdvice] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecommendations(null);
    setGeneralAdvice(null);

    if (!dish.trim()) {
      setError('Voer een gerecht in');
      return;
    }

    // Filter alleen wijnen met quantity > 0
    const availableWines = wines.filter(w => w.quantity > 0);

    if (availableWines.length === 0) {
      setError('Je hebt geen wijnen in voorraad. Voeg eerst wijnen toe aan je kelder.');
      return;
    }

    setLoading(true);
    try {
      const result = await getFoodPairing(dish, availableWines);
      setRecommendations(result.recommendations);
      setGeneralAdvice(result.generalAdvice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDish('');
    setRecommendations(null);
    setGeneralAdvice(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Uitstekende match';
    if (score >= 70) return 'Goede match';
    return 'Redelijke match';
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="mb-4 text-red-900 font-medium flex items-center gap-2"
        >
          ← Terug
        </button>

        <h1 className="text-2xl font-bold text-black mb-2">Wijn/Spijs Combinatie</h1>
        <p className="text-stone-600 mb-6">
          Voer een gerecht in en ontdek welke wijn uit jouw kelder het beste past.
        </p>

        {!recommendations ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Wat ga je eten?
              </label>
              <textarea
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 bg-white text-black resize-none"
                placeholder="bijv. Gegrilde ribeye met truffeljus en geroosterde groenten"
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-stone-200 rounded-lg p-3 text-sm text-stone-600">
              <strong>{wines.filter(w => w.quantity > 0).length}</strong> wijnen beschikbaar in je kelder
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-900 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'AI zoekt de perfecte wijn...' : 'Vind de Perfecte Wijn'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-sm text-stone-500 mb-1">Gerecht:</p>
              <p className="text-black font-medium">{dish}</p>
            </div>

            <h2 className="text-lg font-semibold text-black mt-6">Aanbevelingen</h2>

            {recommendations.length === 0 ? (
              <div className="bg-orange-50 rounded-xl p-4 text-orange-800">
                Helaas geen passende wijnen gevonden in je kelder voor dit gerecht.
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div key={rec.wine.id} className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-stone-400">#{index + 1}</span>
                      <h3 className="text-lg font-bold text-black">{rec.wine.name}</h3>
                      <p className="text-stone-600 text-sm">
                        {rec.wine.year} • {rec.wine.type || 'onbekend'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(rec.score)}`}>
                      {rec.score}%
                    </div>
                  </div>

                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${getScoreColor(rec.score)}`}>
                    {getScoreLabel(rec.score)}
                  </div>

                  <p className="text-stone-600 text-sm">{rec.reason}</p>

                  {rec.wine.country && (
                    <p className="text-stone-400 text-xs mt-2">
                      {rec.wine.country}{rec.wine.region && `, ${rec.wine.region}`}
                    </p>
                  )}
                </div>
              ))
            )}

            {generalAdvice && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <h3 className="font-semibold text-red-900 mb-2">💡 Sommelier Tip</h3>
                <p className="text-red-800 text-sm">{generalAdvice}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full bg-red-900 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
            >
              Nieuw Gerecht Zoeken
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
