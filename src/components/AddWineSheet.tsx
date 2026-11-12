import { useState, type ReactNode } from 'react';
import type { Wine, WineLocation, WineType } from '../types/wine';
import { storage } from '../services/storage';
import { fetchWineInfo, type WineInfo } from '../services/ai';
import { LocationRow } from './LocationRow';
import { ErrorNote, Group, Section, Spinner, Stepper, TypeDot, inputClass, typeLabels } from './ui';

interface AddWineSheetProps {
  locations: WineLocation[];
  onAddLocation: (name: string) => Promise<WineLocation | null>;
  onCancel: () => void;
  onSaved: (wine: Wine) => void;
}

/**
 * Wijn toevoegen. Combineert de oude schermen "Nieuwe wijn" en "Zoek een wijn":
 * vul naam en jaar in, haal de informatie op om te controleren, en bewaar.
 */
export function AddWineSheet({ locations, onAddLocation, onCancel, onSaved }: AddWineSheetProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [grapes, setGrapes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [info, setInfo] = useState<WineInfo | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Lukt het ophalen niet, dan mag je toch bewaren (soort kies je dan zelf)
  const [aiFailed, setAiFailed] = useState(false);
  const [manualType, setManualType] = useState<WineType>('rood');

  const yearNum = parseInt(year);
  const canLookup = name.trim().length > 0 && yearNum > 1800;

  // Gewijzigde naam/jaar/druif = oude informatie klopt niet meer
  const change = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setInfo(null);
  };

  const lookup = async (): Promise<WineInfo | null> => {
    setError(null);
    setFetching(true);
    try {
      const result = await fetchWineInfo(name.trim(), yearNum, grapes.trim() || undefined);
      setInfo(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon geen wijninformatie ophalen');
      setAiFailed(true);
      return null;
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (skipInfo = false) => {
    if (!name.trim()) {
      setError('Vul een naam in');
      return;
    }
    if (!(yearNum > 1800)) {
      setError('Vul een geldig jaar in');
      return;
    }
    setSaving(true);
    const details: Partial<WineInfo> | null = skipInfo ? { type: manualType } : info ?? (await lookup());
    if (!details) {
      setSaving(false);
      return;
    }
    const saved = await storage.saveWine({
      name: name.trim(),
      year: yearNum,
      grapes: grapes.trim() || details.grapes || undefined,
      quantity,
      country: details.country,
      region: details.region,
      type: details.type ?? manualType,
      bestBefore: details.bestBefore,
      tasteProfile: details.tasteProfile,
      pairingAdvice: details.pairingAdvice,
      funFact: details.funFact,
      notes: notes.trim() || undefined,
      location: location || undefined,
    });
    setSaving(false);
    if (saved) onSaved(saved);
    else setError('Kon de wijn niet opslaan. Controleer je verbinding.');
  };

  const busy = fetching || saving;

  return (
    <div className="fixed inset-0 z-40 flex flex-col">
      <div className="absolute inset-0 bg-black/30 animate-fade" onClick={busy ? undefined : onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        className="relative mt-auto w-full max-w-xl mx-auto bg-ground rounded-t-[12px] flex flex-col animate-sheet"
        style={{ height: 'calc(100% - env(safe-area-inset-top) - 12px)' }}
      >
        <div className="flex justify-center pt-1.5">
          <span className="w-9 h-[5px] rounded-full bg-edge" />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[50px] px-2">
          <button type="button" onClick={onCancel} disabled={busy} className="justify-self-start h-11 px-2 text-[17px] text-wine disabled:text-faint">
            Annuleer
          </button>
          <h1 id="add-title" className="text-[17px] font-semibold">Nieuwe wijn</h1>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={busy || !name.trim()}
            className="justify-self-end h-11 px-2 text-[17px] font-semibold text-wine disabled:text-faint flex items-center gap-2"
          >
            {saving && <Spinner />}
            Bewaar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-2 flex flex-col gap-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}>
            <Group>
              <label className="flex items-center gap-3 min-h-12 px-4">
                <span className="w-16 shrink-0 text-base">Naam</span>
                <input
                  type="text"
                  value={name}
                  autoFocus
                  onChange={(e) => change(setName)(e.target.value)}
                  placeholder="bijv. Château Margaux"
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-3 min-h-12 px-4">
                <span className="w-16 shrink-0 text-base">Jaar</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={year}
                  onChange={(e) => change(setYear)(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-3 min-h-12 px-4">
                <span className="w-16 shrink-0 text-base">Druif</span>
                <input
                  type="text"
                  value={grapes}
                  onChange={(e) => change(setGrapes)(e.target.value)}
                  placeholder="Optioneel"
                  className={inputClass}
                />
              </label>
            </Group>

            <Group>
              <div className="flex items-center justify-between min-h-[52px] pl-4 pr-3">
                <span className="text-base">Aantal</span>
                <div className="flex items-center gap-2">
                  <span className="min-w-7 text-center text-base font-semibold tabular-nums">{quantity}</span>
                  <Stepper label="Aantal flessen" value={quantity} min={0} onChange={setQuantity} />
                </div>
              </div>
              <LocationRow value={location} onChange={setLocation} locations={locations} onAddLocation={onAddLocation} />
              <label className="flex px-4 py-3">
                <span className="sr-only">Notities</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notities, bijv. waar gekocht"
                  className={`${inputClass} resize-none leading-6`}
                />
              </label>
            </Group>

            {error && <ErrorNote>{error}</ErrorNote>}

            {aiFailed && !info && (
              <Section title="Toch bewaren" footer="Land, regio, smaak en drinkvenster kun je later invullen via Wijzig.">
                <Group>
                  <label className="relative flex items-center justify-between gap-3 min-h-12 px-4">
                    <span className="text-base">Soort</span>
                    <span className="flex items-center gap-2 text-[15px] text-muted"><TypeDot type={manualType} size={8} />{typeLabels[manualType]}</span>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value as WineType)}
                      className="absolute inset-0 opacity-0 w-full cursor-pointer"
                      aria-label="Soort"
                    >
                      {(Object.keys(typeLabels) as WineType[]).map((t) => (
                        <option key={t} value={t}>{typeLabels[t]}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={busy || !name.trim()}
                    className="w-full min-h-12 text-base text-wine disabled:text-faint active:bg-control"
                  >
                    Bewaar zonder wijninformatie
                  </button>
                </Group>
              </Section>
            )}

            <Section
              title="Wijninformatie"
              footer={info ? 'Opgehaald met AI op basis van naam en jaar. Je kunt alles aanpassen na het bewaren.' : undefined}
            >
              {info ? (
                <Group>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5">
                    <Fact label="Soort">
                      <span className="flex items-center gap-1.5"><TypeDot type={info.type} size={8} />{typeLabels[info.type]}</span>
                    </Fact>
                    <Fact label="Druif">{grapes.trim() || info.grapes || '–'}</Fact>
                    <Fact label="Herkomst">{[info.region, info.country].filter(Boolean).join(', ') || '–'}</Fact>
                    <Fact label="Op dronk">{info.bestBefore || '–'}</Fact>
                  </div>
                  {info.tasteProfile && (
                    <p className="px-4 py-3 text-[15px] leading-[22px] text-stone-700">{info.tasteProfile}</p>
                  )}
                </Group>
              ) : (
                <button
                  type="button"
                  onClick={lookup}
                  disabled={!canLookup || busy}
                  className="w-full min-h-12 rounded-[14px] bg-surface text-base text-wine disabled:text-faint flex items-center justify-center gap-2"
                >
                  {fetching && <Spinner />}
                  {fetching ? 'Informatie ophalen…' : 'Haal informatie op'}
                </button>
              )}
              {!info && (
                <p className="text-[13px] leading-[18px] text-muted px-1 mt-2">
                  Bekijk vooraf wat er over deze wijn bekend is. Bij Bewaar gebeurt dit ook automatisch.
                </p>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[15px] font-medium">{children}</span>
    </div>
  );
}
