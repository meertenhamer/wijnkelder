import { useState } from 'react';
import { storage, type AiProvider, type Me } from '../services/storage';
import type { Wine, WineLocation } from '../types/wine';
import { ErrorNote, Group, Icon, Screen, Section, Segmented } from './ui';

interface SettingsProps {
  me: Me;
  wines: Wine[];
  locations: WineLocation[];
  onAddLocation: (name: string) => Promise<WineLocation | null>;
  onDeleteLocation: (id: string) => Promise<void>;
  onLogout: () => void;
}

function initials(email: string) {
  const local = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();
  const parts = local.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2)).toUpperCase() || '?';
}

export function Settings({ me, wines, locations, onAddLocation, onDeleteLocation, onLogout }: SettingsProps) {
  const [provider, setProvider] = useState<AiProvider>(storage.getAiProvider());
  const [newLocation, setNewLocation] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeProvider = async (p: AiProvider) => {
    const previous = provider;
    setProvider(p);
    const ok = await storage.saveAiProvider(p);
    if (!ok) {
      setProvider(previous);
      setError('Kon de instelling niet opslaan.');
    }
  };

  const hasKey = provider === 'claude' ? me.hasClaude : me.hasOpenAI;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLocation.trim();
    if (!name) return;
    setAdding(true);
    await onAddLocation(name);
    setAdding(false);
    setNewLocation('');
  };

  const handleDelete = async (loc: WineLocation) => {
    if (confirm(`Locatie "${loc.name}" verwijderen? Wijnen met deze locatie houden de naam.`)) {
      await onDeleteLocation(loc.id);
    }
  };

  const countAt = (name: string) => wines.filter((w) => w.location === name && w.quantity > 0).length;

  return (
    <Screen title="Instellingen">
      <div className="bg-surface rounded-[14px] flex items-center gap-3.5 px-4 py-3.5">
        <span className="w-12 h-12 shrink-0 rounded-full bg-wine text-white flex items-center justify-center text-lg font-semibold">
          {initials(me.email)}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-[17px] font-semibold truncate">{me.email}</span>
          <span className="text-sm text-muted">Ingelogd met een code per mail</span>
        </span>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <Section
        title="Wijninformatie"
        footer="De AI vult land, regio, smaak en drinkvenster in en geeft spijs-wijnadvies."
      >
        <Group>
          <div className="flex items-center justify-between min-h-[52px] pl-4 pr-3">
            <span className="text-base">AI</span>
            <Segmented
              label="AI-provider"
              value={provider}
              onChange={changeProvider}
              options={[
                { value: 'claude', label: 'Claude' },
                { value: 'openai', label: 'OpenAI' },
              ]}
            />
          </div>
          <div className="flex items-center justify-between min-h-12 px-4">
            <span className="text-base">API-sleutel</span>
            {hasKey ? (
              <span className="flex items-center gap-1.5 text-[15px] text-ok"><Icon.Check size={16} />Op de server</span>
            ) : (
              <span className="text-[15px] text-danger">Niet ingesteld</span>
            )}
          </div>
        </Group>
      </Section>

      <Section title="Locaties" footer="Wijnen met een verwijderde locatie houden die naam.">
        <Group>
          {locations.map((loc) => {
            const n = countAt(loc.name);
            return (
              <div key={loc.id} className="flex items-center gap-3 min-h-12 pl-4 pr-2">
                <span className="flex-1 text-base truncate">{loc.name}</span>
                <span className="text-[15px] text-muted">{n === 0 ? 'leeg' : `${n} ${n === 1 ? 'wijn' : 'wijnen'}`}</span>
                <button
                  type="button"
                  aria-label={`${loc.name} verwijderen`}
                  onClick={() => handleDelete(loc)}
                  className="w-10 h-10 flex items-center justify-center text-faint active:text-danger"
                >
                  <Icon.Trash size={18} />
                </button>
              </div>
            );
          })}
          <form onSubmit={handleAdd} className="flex items-center gap-2.5 min-h-12 pl-4 pr-2">
            <Icon.Plus size={18} className="text-wine shrink-0" />
            <label className="flex-1 flex">
              <span className="sr-only">Nieuwe locatie</span>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Locatie toevoegen"
                className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-wine outline-none"
              />
            </label>
            {newLocation.trim() && (
              <button type="submit" disabled={adding} className="h-10 px-3 text-base font-semibold text-wine">
                Voeg toe
              </button>
            )}
          </form>
        </Group>
      </Section>

      <Group>
        <button type="button" onClick={onLogout} className="w-full min-h-12 text-base text-danger active:bg-control">
          Uitloggen
        </button>
      </Group>
    </Screen>
  );
}
