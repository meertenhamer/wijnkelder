import type { Wine, WineType } from '../types/wine';

interface DashboardProps {
  wines: Wine[];
  onBack: () => void;
}

function countByField(wines: Wine[], field: keyof Wine): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const wine of wines) {
    const val = wine[field];
    if (val && typeof val === 'string') {
      map[val] = (map[val] || 0) + 1;
    }
  }
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function extractTasteWords(wines: Wine[]): { word: string; count: number }[] {
  const stopWords = new Set(['en', 'met', 'van', 'de', 'het', 'een', 'in', 'op', 'te', 'is', 'dat', 'die', 'voor', 'aan', 'er', 'maar', 'om', 'ook', 'als', 'bij', 'nog', 'wel', 'naar', 'dan', 'al', 'zo', 'uit', 'tot', 'wat', 'veel', 'door', 'over', 'na']);
  const map: Record<string, number> = {};
  for (const wine of wines) {
    if (!wine.tasteProfile) continue;
    const words = wine.tasteProfile.toLowerCase()
      .replace(/[.,;:!?()]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    for (const word of words) {
      map[word] = (map[word] || 0) + 1;
    }
  }
  return Object.entries(map)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function extractTopGrapes(wines: Wine[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const wine of wines) {
    if (!wine.grapes) continue;
    const grapes = wine.grapes.split(/[,/&]+/).map(g => g.trim()).filter(Boolean);
    for (const grape of grapes) {
      const normalized = grape.charAt(0).toUpperCase() + grape.slice(1).toLowerCase();
      map[normalized] = (map[normalized] || 0) + 1;
    }
  }
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

const typeColors: Record<WineType, string> = {
  rood: 'bg-red-800',
  wit: 'bg-amber-500',
  rosé: 'bg-pink-400',
  bruisend: 'bg-amber-300',
};

const typeTextColors: Record<WineType, string> = {
  rood: 'text-red-800',
  wit: 'text-amber-600',
  rosé: 'text-pink-500',
  bruisend: 'text-amber-400',
};

export function Dashboard({ wines, onBack }: DashboardProps) {
  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);
  const inStock = wines.filter(w => w.quantity > 0);
  const ratedWines = wines.filter(w => w.rating);
  const avgRating = ratedWines.length > 0
    ? (ratedWines.reduce((sum, w) => sum + (w.rating || 0), 0) / ratedWines.length).toFixed(1)
    : null;

  const byType = countByField(wines, 'type');
  const totalForType = byType.reduce((s, t) => s + t.count, 0);
  const byCountry = countByField(wines, 'country').slice(0, 5);
  const byRegion = countByField(wines, 'region').slice(0, 5);
  const topGrapes = extractTopGrapes(wines);
  const tasteWords = extractTasteWords(wines);

  const topRated = [...wines]
    .filter(w => w.rating)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  const years = wines.map(w => w.year).sort();
  const oldestYear = years.length > 0 ? years[0] : null;
  const newestYear = years.length > 0 ? years[years.length - 1] : null;

  if (wines.length === 0) {
    return (
      <div className="min-h-screen bg-stone-100 p-4 pt-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={onBack}
            className="mb-4 text-red-900 font-medium flex items-center gap-2"
            style={{ marginTop: 'env(safe-area-inset-top)' }}
          >
            ← Terug
          </button>
          <h1 className="text-2xl font-bold text-stone-800 mb-6">Dashboard</h1>
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm text-center">
            <p className="text-stone-500">Voeg eerst wijnen toe om je dashboard te zien.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 pt-8 pb-12">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="mb-4 text-red-900 font-medium flex items-center gap-2"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          ← Terug
        </button>

        <h1 className="text-2xl font-bold text-stone-800 mb-6">Dashboard</h1>

        {/* Overzicht */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-900">{wines.length}</p>
            <p className="text-stone-500 text-sm">Wijnen</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-900">{totalBottles}</p>
            <p className="text-stone-500 text-sm">Flessen</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-900">{inStock.length}</p>
            <p className="text-stone-500 text-sm">Op voorraad</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-900">{avgRating || '-'}</p>
            <p className="text-stone-500 text-sm">Gem. beoordeling</p>
          </div>
        </div>

        {/* Type verdeling */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-stone-800 mb-3">Verdeling per type</h2>
          <div className="flex rounded-xl overflow-hidden h-6 mb-3">
            {byType.map(({ label, count }) => (
              <div
                key={label}
                className={`${typeColors[label as WineType] || 'bg-stone-300'} transition-all`}
                style={{ width: `${(count / totalForType) * 100}%` }}
                title={`${label}: ${count}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {byType.map(({ label, count }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${typeColors[label as WineType] || 'bg-stone-300'}`} />
                <span className={`text-sm font-medium ${typeTextColors[label as WineType] || 'text-stone-600'}`}>
                  {label}
                </span>
                <span className="text-stone-400 text-sm">({count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top landen */}
        {byCountry.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Top landen</h2>
            <div className="space-y-2">
              {byCountry.map(({ label, count }, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-stone-400 text-xs w-4">{i + 1}.</span>
                  <span className="text-stone-800 text-sm flex-1">{label}</span>
                  <div className="w-24 bg-stone-100 rounded-full h-2">
                    <div
                      className="bg-red-900 h-2 rounded-full"
                      style={{ width: `${(count / byCountry[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-stone-500 text-xs w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top regio's */}
        {byRegion.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Top regio's</h2>
            <div className="space-y-2">
              {byRegion.map(({ label, count }, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-stone-400 text-xs w-4">{i + 1}.</span>
                  <span className="text-stone-800 text-sm flex-1">{label}</span>
                  <div className="w-24 bg-stone-100 rounded-full h-2">
                    <div
                      className="bg-red-900 h-2 rounded-full"
                      style={{ width: `${(count / byRegion[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-stone-500 text-xs w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Druivensoorten */}
        {topGrapes.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Favoriete druiven</h2>
            <div className="flex flex-wrap gap-2">
              {topGrapes.map(({ label, count }) => (
                <span
                  key={label}
                  className="bg-red-50 text-red-900 border border-red-200 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  {label} <span className="text-red-400">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Smaakprofiel woorden */}
        {tasteWords.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Smaakprofiel</h2>
            <div className="flex flex-wrap gap-2">
              {tasteWords.map(({ word, count }) => {
                const maxCount = tasteWords[0].count;
                const size = 0.75 + (count / maxCount) * 0.5;
                const opacity = 0.4 + (count / maxCount) * 0.6;
                return (
                  <span
                    key={word}
                    className="text-red-900 font-medium"
                    style={{ fontSize: `${size}rem`, opacity }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Best beoordeeld */}
        {topRated.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Best beoordeeld</h2>
            <div className="space-y-3">
              {topRated.map((wine, i) => (
                <div key={wine.id} className="flex items-center gap-3">
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 font-medium text-sm truncate">{wine.name}</p>
                    <p className="text-stone-400 text-xs">{wine.year} · {wine.type}</p>
                  </div>
                  <span className="text-amber-500 text-sm">{'★'.repeat(wine.rating || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jaargang spread */}
        {oldestYear && newestYear && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Jaargangen</h2>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-stone-400 text-xs">Oudste</p>
                <p className="text-stone-800 font-bold text-lg">{oldestYear}</p>
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-stone-200 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900 to-red-400 rounded-full" />
              </div>
              <div className="text-center">
                <p className="text-stone-400 text-xs">Nieuwste</p>
                <p className="text-stone-800 font-bold text-lg">{newestYear}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
