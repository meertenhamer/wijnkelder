import { useState } from 'react';
import type { Wine, WineType } from '../types/wine';
import { StarRating } from './StarRating';
import { storage } from '../services/storage';

interface WineCardProps {
  wine: Wine;
  onClose: () => void;
  onUpdate: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

export function WineCard({ wine, onClose, onUpdate, onDelete }: WineCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(wine.notes || '');
  const [rating, setRating] = useState(wine.rating || 0);
  const [quantity, setQuantity] = useState(wine.quantity);
  const [saving, setSaving] = useState(false);

  // Bewerkbare velden
  const [name, setName] = useState(wine.name);
  const [year, setYear] = useState(wine.year);
  const [type, setType] = useState<WineType>(wine.type);
  const [country, setCountry] = useState(wine.country || '');
  const [region, setRegion] = useState(wine.region || '');
  const [grapes, setGrapes] = useState(wine.grapes || '');
  const [bestBefore, setBestBefore] = useState(wine.bestBefore || '');
  const [tasteProfile, setTasteProfile] = useState(wine.tasteProfile || '');
  const [pairingAdvice, setPairingAdvice] = useState(wine.pairingAdvice || '');

  const handleSave = async () => {
    setSaving(true);
    const updatedWine: Wine = {
      ...wine,
      name,
      year,
      type,
      country: country || undefined,
      region: region || undefined,
      grapes: grapes || undefined,
      bestBefore: bestBefore || undefined,
      tasteProfile: tasteProfile || undefined,
      pairingAdvice: pairingAdvice || undefined,
      notes: notes || undefined,
      rating: rating > 0 ? (rating as 1 | 2 | 3 | 4 | 5) : undefined,
      quantity
    };
    await storage.updateWine(updatedWine);
    onUpdate(updatedWine);
    setSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Weet je zeker dat je deze wijn wilt verwijderen?')) {
      await storage.deleteWine(wine.id);
      onDelete(wine.id);
    }
  };

  const typeColors = {
    rood: 'bg-red-800',
    wit: 'bg-amber-500',
    rosé: 'bg-pink-400',
    bruisend: 'bg-amber-300'
  };

  const typeOptions: WineType[] = ['rood', 'wit', 'rosé', 'bruisend'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing ? (
                <>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WineType)}
                    className="bg-stone-100 text-stone-800 text-xs font-medium px-3 py-1 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-900"
                  >
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full text-2xl font-bold text-stone-800 mt-3 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                    className="block w-24 text-stone-500 mt-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </>
              ) : (
                <>
                  <span className={`${typeColors[type]} text-white text-xs font-medium px-3 py-1 rounded-full`}>
                    {type}
                  </span>
                  <h2 className="text-2xl font-bold text-stone-800 mt-3">{name}</h2>
                  <p className="text-stone-500">{year}</p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 text-2xl leading-none ml-4"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-stone-500 text-xs">Land</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900"
                    />
                  </div>
                  <div>
                    <label className="text-stone-500 text-xs">Regio</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900"
                    />
                  </div>
                  <div>
                    <label className="text-stone-500 text-xs">Druif</label>
                    <input
                      type="text"
                      value={grapes}
                      onChange={(e) => setGrapes(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900"
                    />
                  </div>
                  <div>
                    <label className="text-stone-500 text-xs">Beste op dronk</label>
                    <input
                      type="text"
                      value={bestBefore}
                      onChange={(e) => setBestBefore(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 text-xs">Smaakprofiel</label>
                  <textarea
                    value={tasteProfile}
                    onChange={(e) => setTasteProfile(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-stone-500 text-xs">Pairing advies</label>
                  <textarea
                    value={pairingAdvice}
                    onChange={(e) => setPairingAdvice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900 resize-none"
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-100 rounded-xl p-3">
                    <p className="text-stone-500 text-xs">Land</p>
                    <p className="text-stone-800 font-medium">{country || '-'}</p>
                  </div>
                  <div className="bg-stone-100 rounded-xl p-3">
                    <p className="text-stone-500 text-xs">Regio</p>
                    <p className="text-stone-800 font-medium">{region || '-'}</p>
                  </div>
                  <div className="bg-stone-100 rounded-xl p-3">
                    <p className="text-stone-500 text-xs">Druif</p>
                    <p className="text-stone-800 font-medium">{grapes || '-'}</p>
                  </div>
                  <div className="bg-stone-100 rounded-xl p-3">
                    <p className="text-stone-500 text-xs">Beste op dronk</p>
                    <p className="text-stone-800 font-medium">{bestBefore || '-'}</p>
                  </div>
                </div>

                {tasteProfile && (
                  <div className="bg-stone-100 rounded-xl p-4">
                    <p className="text-stone-500 text-xs mb-1">Smaakprofiel</p>
                    <p className="text-stone-800">{tasteProfile}</p>
                  </div>
                )}

                {pairingAdvice && (
                  <div className="bg-stone-100 rounded-xl p-4">
                    <p className="text-stone-500 text-xs mb-1">Pairing advies</p>
                    <p className="text-stone-800">{pairingAdvice}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-stone-200 pt-6 space-y-5">
            <div>
              <label className="block text-stone-600 text-sm mb-2">Aantal flessen</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 w-10 h-10 rounded-xl text-xl"
                >
                  -
                </button>
                <span className="text-stone-800 text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 w-10 h-10 rounded-xl text-xl"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-stone-600 text-sm mb-2">Beoordeling</label>
              <StarRating rating={rating} onChange={setRating} />
            </div>

            <div>
              <label className="block text-stone-600 text-sm mb-2">Opmerkingen</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900 resize-none"
                rows={3}
                placeholder="Jouw notities over deze wijn..."
              />
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    Annuleren
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-600 font-semibold py-3 px-4 rounded-xl transition-all"
                  >
                    🗑
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
