import { useState } from 'react';
import type { Wine, WineType, WineLocation } from '../types/wine';
import { storage } from '../services/storage';
import { formatPrice, parseDrinkWindow, parsePriceInput, priceInputValue } from '../utils/wine';
import { LocationRow } from './LocationRow';
import { ErrorNote, Group, Icon, Section, Spinner, Stars, Stepper, TypeDot, inputClass, typeLabels } from './ui';

interface WineDetailProps {
  wine: Wine;
  locations: WineLocation[];
  onAddLocation: (name: string) => Promise<WineLocation | null>;
  onBack: () => void;
  onUpdate: (wine: Wine) => void;
  onDelete: (id: string) => void;
  /** true zolang Claude de prijs van deze wijn opzoekt */
  pricing: boolean;
  onLookupPrice: () => void;
}

function DrinkWindow({ text }: { text: string }) {
  const win = parseDrinkWindow(text);
  if (!win) {
    return <p className="text-base">{text}</p>;
  }
  const now = new Date().getFullYear();
  const start = Math.min(win.from, now) - 1;
  const end = Math.max(win.to, now) + 1;
  const pos = (y: number) => `${((y - start) / (end - start)) * 100}%`;
  const status =
    now < win.from ? { label: 'Nog te jong', cls: 'text-warn' }
    : now > win.to ? { label: 'Over het hoogtepunt', cls: 'text-danger' }
    : { label: 'Nu op dronk', cls: 'text-ok' };
  const remaining = win.to - now;
  const hint =
    now < win.from ? `op dronk vanaf ${win.from}`
    : now > win.to ? `venster liep tot ${win.to}`
    : remaining === 0 ? 'laatste jaar' : `nog ± ${remaining} jaar`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-baseline px-1">
        <h2 className="text-[13px] font-semibold tracking-wide uppercase text-muted">Drinkvenster</h2>
        <span className={`text-sm font-semibold ${status.cls}`}>{status.label}</span>
      </div>
      <div className="relative h-1.5 bg-edge rounded-full mx-1" role="img" aria-label={`Op dronk van ${win.from} tot ${win.to}`}>
        <div className="absolute inset-y-0 bg-wine rounded-full" style={{ left: pos(win.from), right: `calc(100% - ${pos(win.to)})` }} />
        <div
          className="absolute -top-[5px] w-4 h-4 -ml-2 rounded-full bg-surface shadow-[0_0_0_2px_var(--color-ink)]"
          style={{ left: pos(now + 0.5) }}
        />
      </div>
      <div className="flex justify-between text-[13px] text-muted tabular-nums px-1">
        <span>{win.from === win.to ? win.from : `${win.from} – ${win.to}`}</span>
        <span>{hint}</span>
      </div>
    </div>
  );
}

/** Splitst "Wild, eend, lamsvlees en zachte kazen" in losse labels als dat kan */
function pairingChips(text?: string): string[] | null {
  if (!text) return null;
  const parts = text
    .replace(/\.$/, '')
    .split(/,|;| en | of /)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.some((p) => p.length > 32)) return null;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
}

export function WineDetail({ wine, locations, onAddLocation, onBack, onUpdate, onDelete, pricing, onLookupPrice }: WineDetailProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(wine);
  const [notes, setNotes] = useState(wine.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direct opslaan voor voorraad, beoordeling, locatie en notities
  const save = async (changes: Partial<Wine>) => {
    const updated: Wine = { ...wine, ...changes };
    onUpdate(updated);
    setDraft((d) => ({ ...d, ...changes }));
    const ok = await storage.updateWine(updated);
    setError(ok ? null : 'Opslaan is mislukt. Controleer je verbinding.');
  };

  const startEditing = () => {
    setDraft(wine);
    setError(null);
    setEditing(true);
  };

  const finishEditing = async () => {
    if (!draft.name.trim()) {
      setError('Vul een naam in');
      return;
    }
    setSaving(true);
    const updated: Wine = {
      ...wine,
      ...draft,
      name: draft.name.trim(),
      notes: notes || undefined,
    };
    const ok = await storage.updateWine(updated);
    setSaving(false);
    if (!ok) {
      setError('Opslaan is mislukt. Controleer je verbinding.');
      return;
    }
    onUpdate(updated);
    setEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!confirm(`"${wine.name}" verwijderen uit je kelder?`)) return;
    const ok = await storage.deleteWine(wine.id);
    if (ok) onDelete(wine.id);
    else setError('Verwijderen is mislukt.');
  };

  const set = <K extends keyof Wine>(key: K) => (value: Wine[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const chips = pairingChips(wine.pairingAdvice);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ground animate-push">
      <div className="shrink-0 max-w-xl w-full mx-auto flex justify-between items-center h-11 px-2">
        {editing ? (
          <button type="button" onClick={() => { setEditing(false); setError(null); }} className="h-11 px-2 text-[17px] text-wine">
            Annuleer
          </button>
        ) : (
          <button type="button" onClick={onBack} className="h-11 pl-1 pr-2 flex items-center gap-1 text-[17px] text-wine">
            <Icon.Back size={22} />
            Kelder
          </button>
        )}
        {editing ? (
          <button type="button" onClick={finishEditing} disabled={saving} className="h-11 px-2 text-[17px] font-semibold text-wine flex items-center gap-2">
            {saving && <Spinner />}
            Gereed
          </button>
        ) : (
          <button type="button" onClick={startEditing} className="h-11 px-2 text-[17px] text-wine">
            Wijzig
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-5 pt-2 pb-12 flex flex-col gap-6">
          {error && <ErrorNote>{error}</ErrorNote>}

          {editing ? (
            <EditFields draft={draft} set={set} />
          ) : (
            <header className="flex flex-col gap-1.5">
              <p className="flex items-center gap-2 text-[13px] font-semibold tracking-wide uppercase text-wine">
                <TypeDot type={wine.type} size={8} />
                {typeLabels[wine.type]} · {wine.year}
              </p>
              <h1 className="text-[28px] leading-[33px] font-bold tracking-tight">{wine.name}</h1>
              <p className="text-[15px] text-muted">
                {[[wine.region, wine.country].filter(Boolean).join(', '), wine.grapes].filter(Boolean).join(' · ')}
              </p>
            </header>
          )}

          <Group>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] text-muted">Voorraad</span>
                <span className="text-xl font-semibold tabular-nums">
                  {wine.quantity === 0 ? 'Op' : `${wine.quantity} ${wine.quantity === 1 ? 'fles' : 'flessen'}`}
                </span>
              </div>
              <Stepper label="Aantal flessen" value={wine.quantity} onChange={(quantity) => save({ quantity })} />
            </div>
            <div className="flex items-center justify-between gap-3 min-h-12 px-4">
              <span className="text-base">Prijs per fles</span>
              {pricing ? (
                <span className="flex items-center gap-2 text-[15px] text-muted"><Spinner />Claude zoekt op…</span>
              ) : wine.price != null ? (
                <span className="flex items-center gap-2 text-[15px]">
                  <span className="tabular-nums">{formatPrice(wine.price)}</span>
                  {wine.priceEstimated && (
                    <button type="button" onClick={onLookupPrice} className="text-[13px] text-muted underline decoration-faint underline-offset-2" aria-label="Geschatte prijs opnieuw opzoeken">
                      geschat
                    </button>
                  )}
                </span>
              ) : (
                <button type="button" onClick={onLookupPrice} className="h-10 text-[15px] text-wine">Zoek prijs op</button>
              )}
            </div>
            <LocationRow
              value={wine.location || ''}
              onChange={(location) => save({ location: location || undefined })}
              locations={locations}
              onAddLocation={onAddLocation}
            />
            <div className="flex items-center justify-between min-h-12 pl-4 pr-3">
              <span className="text-base">Beoordeling</span>
              <Stars
                value={wine.rating || 0}
                onChange={(n) => save({ rating: n ? (n as Wine['rating']) : undefined })}
              />
            </div>
          </Group>

          {!editing && wine.bestBefore && <DrinkWindow text={wine.bestBefore} />}

          {!editing && wine.tasteProfile && (
            <Section title="Smaak">
              <p className="text-base leading-6 px-1">{wine.tasteProfile}</p>
            </Section>
          )}

          {!editing && wine.pairingAdvice && (
            <Section title="Past bij">
              {chips ? (
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <span key={c} className="px-2.5 py-1.5 rounded-lg bg-surface text-sm">{c}</span>
                  ))}
                </div>
              ) : (
                <p className="text-base leading-6 px-1">{wine.pairingAdvice}</p>
              )}
            </Section>
          )}

          {!editing && wine.funFact && (
            <Section title="Weetje">
              <p className="text-base leading-6 px-1">{wine.funFact}</p>
            </Section>
          )}

          <Section title="Notities">
            <Group>
              <label className="flex px-4 py-3">
                <span className="sr-only">Notities</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => { if (!editing && notes !== (wine.notes || '')) save({ notes: notes || undefined }); }}
                  rows={3}
                  placeholder="Waar gekocht, met wie gedronken…"
                  className={`${inputClass} resize-none leading-6`}
                />
              </label>
            </Group>
          </Section>

          {editing && (
            <Group>
              <button type="button" onClick={handleDelete} className="w-full min-h-12 flex items-center justify-center gap-2 text-base text-danger">
                <Icon.Trash size={18} />
                Verwijder wijn
              </button>
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

function EditFields({ draft, set }: {
  draft: Wine;
  set: <K extends keyof Wine>(key: K) => (value: Wine[K]) => void;
}) {
  const text = (key: 'name' | 'grapes' | 'country' | 'region' | 'bestBefore', label: string, placeholder = '') => (
    <label className="flex items-center gap-3 min-h-12 px-4">
      <span className="w-24 shrink-0 text-base">{label}</span>
      <input
        type="text"
        value={(draft[key] as string | undefined) ?? ''}
        placeholder={placeholder}
        onChange={(e) => set(key)((e.target.value || (key === 'name' ? '' : undefined)) as never)}
        className={inputClass}
      />
    </label>
  );
  const area = (key: 'tasteProfile' | 'pairingAdvice' | 'funFact', label: string) => (
    <Section title={label}>
      <Group>
        <label className="flex px-4 py-3">
          <span className="sr-only">{label}</span>
          <textarea
            value={draft[key] ?? ''}
            onChange={(e) => set(key)(e.target.value || undefined)}
            rows={Math.max(3, Math.ceil((draft[key]?.length ?? 0) / 36))}
            className={`${inputClass} resize-none leading-6`}
          />
        </label>
      </Group>
    </Section>
  );

  return (
    <>
      <Group>
        {text('name', 'Naam')}
        <label className="flex items-center gap-3 min-h-12 px-4">
          <span className="w-24 shrink-0 text-base">Jaar</span>
          <input
            type="number"
            inputMode="numeric"
            value={draft.year || ''}
            onChange={(e) => set('year')(parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
        <label className="relative flex items-center gap-3 min-h-12 px-4">
          <span className="w-24 shrink-0 text-base">Soort</span>
          <span className="flex items-center gap-2 text-base"><TypeDot type={draft.type} size={8} />{typeLabels[draft.type]}</span>
          <select
            value={draft.type}
            onChange={(e) => set('type')(e.target.value as WineType)}
            className="absolute inset-0 opacity-0 w-full cursor-pointer"
            aria-label="Soort"
          >
            {(Object.keys(typeLabels) as WineType[]).map((t) => (
              <option key={t} value={t}>{typeLabels[t]}</option>
            ))}
          </select>
        </label>
        {text('grapes', 'Druif')}
        {text('region', 'Regio')}
        {text('country', 'Land')}
        {text('bestBefore', 'Op dronk', 'bijv. 2025-2030')}
        <label className="flex items-center gap-3 min-h-12 px-4">
          <span className="w-24 shrink-0 text-base">Prijs</span>
          <span className="text-base text-muted">€</span>
          <input
            type="text"
            inputMode="decimal"
            defaultValue={priceInputValue(draft.price)}
            placeholder="per fles"
            onChange={(e) => {
              set('price')(parsePriceInput(e.target.value));
              set('priceEstimated')(false);
            }}
            className={inputClass}
          />
        </label>
      </Group>
      {area('tasteProfile', 'Smaak')}
      {area('pairingAdvice', 'Past bij')}
      {area('funFact', 'Weetje')}
    </>
  );
}
