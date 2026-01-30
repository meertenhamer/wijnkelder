import { useState } from 'react';
import type { Wine, WineType } from '../types/wine';
import { WineCard } from './WineCard';

interface WineCellarProps {
  wines: Wine[];
  onBack: () => void;
  onUpdate: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

type FilterType = 'all' | WineType;

export function WineCellar({ wines, onBack, onUpdate, onDelete }: WineCellarProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWines = wines.filter((wine) => {
    const matchesFilter = filter === 'all' || wine.type === filter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      wine.name.toLowerCase().includes(search) ||
      wine.year.toString().includes(search) ||
      (wine.grapes?.toLowerCase().includes(search) ?? false) ||
      (wine.country?.toLowerCase().includes(search) ?? false) ||
      (wine.region?.toLowerCase().includes(search) ?? false) ||
      (wine.type?.toLowerCase().includes(search) ?? false) ||
      (wine.tasteProfile?.toLowerCase().includes(search) ?? false) ||
      (wine.pairingAdvice?.toLowerCase().includes(search) ?? false) ||
      (wine.notes?.toLowerCase().includes(search) ?? false);
    return matchesFilter && matchesSearch;
  });

  const filterOptions: { value: FilterType; label: string; color: string }[] = [
    { value: 'all', label: 'Alle', color: 'bg-stone-600' },
    { value: 'rood', label: 'Rood', color: 'bg-red-800' },
    { value: 'wit', label: 'Wit', color: 'bg-amber-500' },
    { value: 'rosé', label: 'Rosé', color: 'bg-pink-400' },
    { value: 'bruisend', label: 'Bruisend', color: 'bg-amber-300' }
  ];

  const typeColors = {
    rood: 'bg-red-800',
    wit: 'bg-amber-500',
    rosé: 'bg-pink-400',
    bruisend: 'bg-amber-300'
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6 pt-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="text-stone-600 hover:text-stone-800 mb-6 flex items-center gap-2"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          <span>←</span> Terug
        </button>

        <h1 className="text-3xl font-bold text-stone-800 mb-6">Wijnkelder</h1>

        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Zoek wijn..."
            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === option.value
                  ? `${option.color} text-white shadow-lg`
                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filteredWines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 text-lg">
              {wines.length === 0
                ? 'Je wijnkelder is nog leeg'
                : 'Geen wijnen gevonden'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWines.map((wine) => (
              <button
                key={wine.id}
                onClick={() => setSelectedWine(wine)}
                className="w-full bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`${typeColors[wine.type]} w-3 h-3 rounded-full`} />
                    <div>
                      <h3 className="text-stone-800 font-semibold">{wine.name}</h3>
                      <p className="text-stone-500 text-sm">
                        {wine.year} • {wine.region || wine.country || wine.grapes}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-stone-800 font-medium">{wine.quantity}x</p>
                    {wine.rating && (
                      <p className="text-amber-500 text-sm">
                        {'★'.repeat(wine.rating)}{'☆'.repeat(5 - wine.rating)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 text-center text-stone-500 text-sm">
          {filteredWines.length} {filteredWines.length === 1 ? 'wijn' : 'wijnen'}
          {filter !== 'all' && ` (${filter})`}
        </div>
      </div>

      {selectedWine && (
        <WineCard
          wine={selectedWine}
          onClose={() => setSelectedWine(null)}
          onUpdate={(updatedWine) => {
            onUpdate(updatedWine);
            setSelectedWine(updatedWine);
          }}
          onDelete={(id) => {
            onDelete(id);
            setSelectedWine(null);
          }}
        />
      )}
    </div>
  );
}
