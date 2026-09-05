import { useState, useEffect } from 'react';
import { storage, type AiProvider } from '../services/storage';
import type { WineLocation } from '../types/wine';

interface SettingsProps {
  onBack: () => void;
  locations: WineLocation[];
  onAddLocation: (name: string) => Promise<WineLocation | null>;
  onDeleteLocation: (id: string) => Promise<void>;
}

export function Settings({ onBack, locations, onAddLocation, onDeleteLocation }: SettingsProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [aiProvider, setAiProvider] = useState<AiProvider>('openai');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);

  useEffect(() => {
    setOpenaiKey(storage.getApiKey() || '');
    setClaudeKey(storage.getClaudeApiKey() || '');
    setAiProvider(storage.getAiProvider());
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    await storage.saveSettings({
      openaiApiKey: openaiKey,
      claudeApiKey: claudeKey,
      aiProvider,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddLocation = async () => {
    const trimmed = newLocation.trim();
    if (!trimmed) return;
    setAddingLocation(true);
    await onAddLocation(trimmed);
    setAddingLocation(false);
    setNewLocation('');
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    if (confirm(`Locatie "${name}" verwijderen? Wijnen met deze locatie behouden de tekst.`)) {
      await onDeleteLocation(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100 p-6 pt-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="text-stone-600 hover:text-stone-800 mb-6 flex items-center gap-2"
          
        >
          <span>←</span> Terug
        </button>

        <h1 className="text-3xl font-bold text-stone-800 mb-8">Instellingen</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold text-stone-800">AI Provider</h2>
            <p className="text-stone-500 text-sm">
              Kies welke AI gebruikt wordt voor wijn informatie en aanbevelingen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setAiProvider('openai')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  aiProvider === 'openai'
                    ? 'bg-red-900 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                OpenAI
              </button>
              <button
                onClick={() => setAiProvider('claude')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  aiProvider === 'claude'
                    ? 'bg-red-900 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Claude
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold text-stone-800">API Keys</h2>
            <p className="text-stone-500 text-sm">
              Je keys worden veilig opgeslagen in je account en nooit gedeeld.
            </p>

            <div>
              <label className="block text-stone-700 text-sm font-medium mb-2">
                OpenAI API Key
                {aiProvider === 'openai' && (
                  <span className="ml-2 text-xs text-red-700 font-normal">(actief)</span>
                )}
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-stone-700 text-sm font-medium mb-2">
                Claude API Key
                {aiProvider === 'claude' && (
                  <span className="ml-2 text-xs text-red-700 font-normal">(actief)</span>
                )}
              </label>
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
                placeholder="sk-ant-..."
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold text-stone-800">Locaties</h2>
            <p className="text-stone-500 text-sm">
              Beheer waar je wijnen liggen, bijv. Klimaatkast, Wijnrek of Wijnkast.
            </p>

            {locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3"
                  >
                    <span className="text-stone-800">📍 {loc.name}</span>
                    <button
                      onClick={() => handleDeleteLocation(loc.id, loc.name)}
                      className="text-stone-400 hover:text-red-600 transition-all"
                      aria-label={`${loc.name} verwijderen`}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 text-sm italic">Nog geen locaties toegevoegd.</p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                placeholder="Nieuwe locatie..."
                className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
              />
              <button
                onClick={handleAddLocation}
                disabled={addingLocation || !newLocation.trim()}
                className="bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-medium px-5 rounded-xl transition-all disabled:cursor-not-allowed"
              >
                {addingLocation ? '...' : 'Toevoegen'}
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {saving ? 'Opslaan...' : saved ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
