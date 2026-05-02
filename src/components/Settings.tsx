import { useState, useEffect } from 'react';
import { storage, type AiProvider } from '../services/storage';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [aiProvider, setAiProvider] = useState<AiProvider>('openai');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="h-full overflow-y-auto bg-stone-100 p-6 pt-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="text-stone-600 hover:text-stone-800 mb-6 flex items-center gap-2"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
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
