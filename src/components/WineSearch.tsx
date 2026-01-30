import { useState } from 'react';
import type { Wine } from '../types/wine';
import { getWineInfo } from '../services/openai';
import { storage } from '../services/storage';

interface WineInfo {
  druif: string;
  land: string;
  regio: string;
  soort: 'rood' | 'wit' | 'rosé' | 'bruisend';
  bestOpDronk: string;
  smaakprofiel: string;
  pairingAdvies: string;
}

interface WineSearchProps {
  onBack: () => void;
  onAddWine?: (wine: Wine) => void;
}

export function WineSearch({ onBack, onAddWine }: WineSearchProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [grapes, setGrapes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wineInfo, setWineInfo] = useState<WineInfo | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWineInfo(null);

    if (!name.trim() || !year.trim()) {
      setError('Vul minimaal de naam en het jaar in');
      return;
    }

    setLoading(true);
    try {
      const info = await getWineInfo(name, parseInt(year), grapes || undefined);
      setWineInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis bij het ophalen van de wijn informatie');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setYear('');
    setGrapes('');
    setWineInfo(null);
    setError(null);
    setQuantity(1);
    setNotes('');
    setAdded(false);
  };

  const handleAddTocellar = async () => {
    if (!wineInfo) return;

    setSaving(true);
    setError(null);

    try {
      const wineData = {
        name: name,
        year: parseInt(year),
        grapes: grapes || wineInfo.druif,
        quantity: quantity,
        country: wineInfo.land,
        region: wineInfo.regio,
        type: wineInfo.soort,
        bestBefore: wineInfo.bestOpDronk,
        tasteProfile: wineInfo.smaakprofiel,
        pairingAdvice: wineInfo.pairingAdvies,
        notes: notes || undefined,
      };

      const savedWine = await storage.saveWine(wineData);
      if (savedWine && onAddWine) {
        onAddWine(savedWine);
        setAdded(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon wijn niet opslaan');
    } finally {
      setSaving(false);
    }
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

        <h1 className="text-2xl font-bold text-black mb-6">Zoek een Wijn</h1>

        {!wineInfo ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Naam van de wijn *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 bg-white text-black"
                placeholder="bijv. Château Margaux"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Jaar *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 bg-white text-black"
                placeholder="bijv. 2018"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Druivensoort (optioneel)
              </label>
              <input
                type="text"
                value={grapes}
                onChange={(e) => setGrapes(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 bg-white text-black"
                placeholder="bijv. Cabernet Sauvignon"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-900 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Zoeken...' : 'Zoek Wijn Informatie'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-black mb-1">{name}</h2>
              <p className="text-stone-600 mb-4">{year} {grapes && `• ${grapes}`}</p>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-stone-500">Druif:</span>
                  <span className="text-black font-medium">{wineInfo.druif}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Land:</span>
                  <span className="text-black font-medium">{wineInfo.land}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Regio:</span>
                  <span className="text-black font-medium">{wineInfo.regio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Soort:</span>
                  <span className={`font-medium px-2 py-1 rounded ${
                    wineInfo.soort === 'rood' ? 'bg-red-100 text-red-800' :
                    wineInfo.soort === 'wit' ? 'bg-yellow-100 text-yellow-800' :
                    wineInfo.soort === 'rosé' ? 'bg-pink-100 text-pink-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {wineInfo.soort}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Beste op dronk:</span>
                  <span className="text-black font-medium">{wineInfo.bestOpDronk}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="font-semibold text-black mb-2">Smaakprofiel</h3>
                <p className="text-stone-600 text-sm">{wineInfo.smaakprofiel}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="font-semibold text-black mb-2">Pairing Advies</h3>
                <p className="text-stone-600 text-sm">{wineInfo.pairingAdvies}</p>
              </div>
            </div>

            {!added ? (
              <div className="bg-white rounded-xl p-4 shadow-md space-y-4">
                <h3 className="font-semibold text-black">Toevoegen aan kelder?</h3>

                <div>
                  <label className="block text-sm text-stone-600 mb-1">Aantal flessen</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 bg-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm text-stone-600 mb-1">
                    Herkomst / Opmerkingen <span className="text-stone-400">(optioneel)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 bg-white text-black resize-none"
                    placeholder="bijv. Gekregen van Jan, of Gekocht bij Gall & Gall"
                    rows={2}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAddTocellar}
                  disabled={saving}
                  className="w-full bg-red-900 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Opslaan...' : '+ Toevoegen aan Kelder'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-green-800 text-center">
                ✓ Wijn toegevoegd aan je kelder!
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full bg-stone-200 text-stone-700 py-3 rounded-lg font-semibold hover:bg-stone-300 transition-colors"
            >
              Zoek Andere Wijn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
