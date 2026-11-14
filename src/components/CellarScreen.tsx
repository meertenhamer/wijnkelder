import { useMemo, useState } from 'react';
import type { Wine, WineType, WineLocation } from '../types/wine';
import { Chevron, Group, Icon, Screen, SectionHeader, TypeDot, typeLabels } from './ui';
import { drinkStatus, parseDrinkWindow } from '../utils/wine';

type TypeFilter = 'alle' | WineType;
type SortKey = 'recent' | 'naam' | 'jaar' | 'dronk';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Laatst toegevoegd',
  naam: 'Naam',
  jaar: 'Jaargang',
  dronk: 'Op dronk (eerst drinken)',
};

const PREFS_KEY = 'wijnkelder_kelder_weergave';

function loadPrefs(): { sort: SortKey; showEmpty: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { sort: 'recent', showEmpty: false, ...JSON.parse(raw) };
  } catch {
    // geen opgeslagen voorkeur
  }
  return { sort: 'recent', showEmpty: false };
}

function savePrefs(prefs: { sort: SortKey; showEmpty: boolean }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // niet erg
  }
}

interface CellarScreenProps {
  wines: Wine[];
  locations: WineLocation[];
  onOpenWine: (wine: Wine) => void;
  onAdd: () => void;
}

export function CellarScreen({ wines, locations, onOpenWine, onAdd }: CellarScreenProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('alle');
  const [onlyReady, setOnlyReady] = useState(false);
  const [search, setSearch] = useState('');
  const [prefs, setPrefs] = useState(loadPrefs);
  const [menuOpen, setMenuOpen] = useState(false);

  const updatePrefs = (next: Partial<typeof prefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    savePrefs(merged);
  };

  const inStock = wines.filter((w) => w.quantity > 0);
  const bottles = wines.reduce((sum, w) => sum + w.quantity, 0);
  const stockBase = prefs.showEmpty ? wines : inStock;
  const readyCount = stockBase.filter((w) => drinkStatus(w) === 'op-dronk').length;
  const base = onlyReady ? stockBase.filter((w) => drinkStatus(w) === 'op-dronk') : stockBase;

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: base.length };
    for (const w of base) c[w.type] = (c[w.type] || 0) + 1;
    return c;
  }, [base]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = base.filter((wine) => {
      if (typeFilter !== 'alle' && wine.type !== typeFilter) return false;
      if (!q) return true;
      return [
        wine.name, String(wine.year), wine.grapes, wine.country, wine.region,
        wine.type, wine.tasteProfile, wine.pairingAdvice, wine.notes, wine.location,
      ].some((v) => v?.toLowerCase().includes(q));
    });
    const sorted = [...list];
    if (prefs.sort === 'naam') sorted.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    else if (prefs.sort === 'jaar') sorted.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name, 'nl'));
    else if (prefs.sort === 'dronk') {
      // Eerst wat het eerst op moet: einde van het drinkvenster oplopend, onbekend achteraan
      const end = (w: Wine) => parseDrinkWindow(w.bestBefore)?.to ?? Infinity;
      const start = (w: Wine) => parseDrinkWindow(w.bestBefore)?.from ?? Infinity;
      sorted.sort((a, b) => end(a) - end(b) || start(a) - start(b) || a.name.localeCompare(b.name, 'nl'));
    }
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [base, typeFilter, search, prefs.sort]);

  // Groepeer per locatie zodra er locaties in gebruik zijn (niet tijdens zoeken)
  const sections = useMemo(() => {
    const usesLocations = filtered.some((w) => w.location);
    // Bij "eerst drinken" één doorlopende lijst, zodat de volgorde klopt
    if (!usesLocations || search.trim() || prefs.sort === 'dronk') return [{ title: null as string | null, wines: filtered }];
    const order = [...locations.map((l) => l.name)];
    for (const w of filtered) if (w.location && !order.includes(w.location)) order.push(w.location);
    const result = order
      .map((name) => ({ title: name as string | null, wines: filtered.filter((w) => w.location === name) }))
      .filter((s) => s.wines.length > 0);
    const rest = filtered.filter((w) => !w.location);
    if (rest.length) result.push({ title: 'Zonder locatie', wines: rest });
    return result;
  }, [filtered, locations, search, prefs.sort]);

  const chips: { value: TypeFilter; label: string }[] = [
    { value: 'alle', label: 'Alles' },
    ...(['rood', 'wit', 'bruisend', 'rosé'] as WineType[]).map((t) => ({ value: t as TypeFilter, label: typeLabels[t] })),
  ];

  return (
    <Screen
      title="Kelder"
      subtitle={`${inStock.length} ${inStock.length === 1 ? 'wijn' : 'wijnen'} op voorraad · ${bottles} ${bottles === 1 ? 'fles' : 'flessen'}`}
      actions={
        <>
          <div className="relative">
            <button
              type="button"
              aria-label="Sorteren en weergave"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-11 h-11 flex items-center justify-center text-wine"
            >
              <Icon.Sort size={22} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-1 top-12 z-20 w-64 bg-surface rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.16)] overflow-hidden divide-y divide-line animate-fade">
                  <div className="py-1">
                    <p className="px-4 pt-2 pb-1 text-[13px] text-muted">Sorteren op</p>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { updatePrefs({ sort: key }); setMenuOpen(false); }}
                        className="w-full flex items-center justify-between h-11 px-4 text-base active:bg-control"
                      >
                        {SORT_LABELS[key]}
                        {prefs.sort === key && <Icon.Check size={18} className="text-wine" />}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { updatePrefs({ showEmpty: !prefs.showEmpty }); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between h-12 px-4 text-base active:bg-control"
                  >
                    Toon ook lege flessen
                    {prefs.showEmpty && <Icon.Check size={18} className="text-wine" />}
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Wijn toevoegen"
            onClick={onAdd}
            className="w-9 h-9 mr-1 rounded-full bg-wine text-white flex items-center justify-center active:bg-wine-dark"
          >
            <Icon.Plus size={18} />
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 -mt-1">
        <label className="flex items-center gap-2 h-[38px] px-3 bg-fill rounded-[10px] text-muted">
          <Icon.Search size={17} />
          <span className="sr-only">Zoeken</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Naam, druif, regio…"
            className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-muted outline-none"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-0.5 [scrollbar-width:none]">
          <button
            type="button"
            aria-pressed={onlyReady}
            onClick={() => setOnlyReady(!onlyReady)}
            className={`shrink-0 h-[34px] px-3 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
              onlyReady ? 'bg-ok text-white' : 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]'
            }`}
          >
            {onlyReady ? <Icon.Check size={15} /> : <span aria-hidden="true" className="w-2 h-2 rounded-full bg-ok" />}
            Op dronk
            <span className={`font-medium ${onlyReady ? 'text-white/80' : 'text-muted'}`}>{readyCount}</span>
          </button>
          <span aria-hidden="true" className="shrink-0 w-px my-1.5 bg-edge" />
          {chips.map((chip) => {
            const on = typeFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={on}
                onClick={() => setTypeFilter(chip.value)}
                className={`shrink-0 h-[34px] px-3 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
                  on ? 'bg-ink text-white' : 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]'
                }`}
              >
                {chip.label}
                <span className={`font-medium ${on ? 'text-stone-300' : 'text-muted'}`}>{counts[chip.value] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <p className="text-[17px] font-semibold">
            {wines.length === 0 ? 'Je kelder is nog leeg' : 'Geen wijnen gevonden'}
          </p>
          <p className="text-[15px] text-muted mt-1">
            {wines.length === 0
              ? 'Tik op + om je eerste wijn toe te voegen.'
              : onlyReady ? 'Geen wijnen die nu op dronk zijn met deze filters.'
              : prefs.showEmpty ? 'Probeer een andere zoekterm of soort.' : 'Lege flessen zie je via het sorteermenu.'}
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.title ?? 'alle'}>
            {section.title && <SectionHeader trailing={section.wines.length}>{section.title}</SectionHeader>}
            <Group>
              {section.wines.map((wine) => (
                <WineRow key={wine.id} wine={wine} showWindow={prefs.sort === 'dronk'} onClick={() => onOpenWine(wine)} />
              ))}
            </Group>
          </section>
        ))
      )}
    </Screen>
  );
}

const STATUS_TEXT: Record<string, string> = { jong: 'nog te jong', 'op-dronk': 'op dronk', over: 'over hoogtepunt' };

function WineRow({ wine, onClick, showWindow }: { wine: Wine; onClick: () => void; showWindow?: boolean }) {
  const win = showWindow ? parseDrinkWindow(wine.bestBefore) : null;
  const place = win
    ? `${STATUS_TEXT[drinkStatus(wine)]} · ${win.from === win.to ? win.from : `${win.from}–${win.to}`}`
    : [wine.region, wine.country].filter(Boolean).join(', ') || wine.grapes;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 min-h-16 pl-4 pr-3.5 py-2.5 text-left active:bg-control"
    >
      <TypeDot type={wine.type} />
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-base font-semibold truncate">{wine.name}</span>
        <span className="text-sm text-muted truncate">
          {wine.year}{place ? ` · ${place}` : ''}
        </span>
      </span>
      {wine.rating ? (
        <span className="flex items-center gap-0.5 text-sm text-muted tabular-nums">
          <Icon.Star size={13} filled className="text-warn" />
          {wine.rating}
        </span>
      ) : null}
      <span className={`text-[15px] tabular-nums w-10 text-right ${wine.quantity > 0 ? 'font-medium' : 'text-muted'}`}>
        {wine.quantity > 0 ? `${wine.quantity} fl.` : 'Op'}
      </span>
      <Chevron />
    </button>
  );
}
