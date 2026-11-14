import type { ReactNode } from 'react';
import type { Wine, WineType } from '../types/wine';
import { Group, Screen, Section, typeBarClass, typeLabels, TypeDot } from './ui';
import { formatPrice } from '../utils/wine';

interface DashboardProps {
  wines: Wine[];
  onOpenWine: (wine: Wine) => void;
}

function countBy(values: (string | undefined)[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) if (v) map.set(v, (map.get(v) || 0) + 1);
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function topGrapes(wines: Wine[]) {
  return countBy(
    wines.flatMap((w) =>
      (w.grapes || '')
        .split(/[,/&]+/)
        .map((g) => g.trim().replace(/\s*\(.*\)$/, ''))
        .filter(Boolean)
        .map((g) => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase())
    )
  ).slice(0, 6);
}

const STOP = new Set(['en', 'met', 'van', 'de', 'het', 'een', 'in', 'op', 'te', 'is', 'dat', 'die', 'voor', 'aan', 'er', 'maar', 'om', 'ook', 'als', 'bij', 'nog', 'wel', 'naar', 'dan', 'al', 'zo', 'uit', 'tot', 'wat', 'veel', 'door', 'over', 'na', 'tonen', 'aroma\'s', 'hints', 'lichte', 'goede']);

function tasteWords(wines: Wine[]) {
  return countBy(
    wines.flatMap((w) =>
      (w.tasteProfile || '')
        .toLowerCase()
        .replace(/[.,;:!?()]/g, '')
        .split(/\s+/)
        .filter((x) => x.length > 2 && !STOP.has(x))
    )
  ).slice(0, 12);
}

function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = items[0]?.count || 1;
  return (
    <Group className="!divide-y-0 py-1.5">
      {items.map(({ label, count }) => (
        <div key={label} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2rem] items-center gap-2.5 h-9 px-4 text-[15px]">
          <span className="truncate">{label}</span>
          <span className="h-2 bg-control rounded-full overflow-hidden">
            <span className="block h-full bg-stone-600 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className="text-right text-muted tabular-nums">{count}</span>
        </div>
      ))}
    </Group>
  );
}

function Stat({ value, label, className = '' }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={`px-4 py-3.5 flex flex-col gap-0.5 ${className}`}>
      <span className="text-[28px] leading-8 font-bold tracking-tight tabular-nums">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export function Dashboard({ wines, onOpenWine }: DashboardProps) {
  if (wines.length === 0) {
    return (
      <Screen title="Overzicht">
        <p className="text-[15px] text-muted text-center py-16">Voeg eerst wijnen toe om je overzicht te zien.</p>
      </Screen>
    );
  }

  const bottles = wines.reduce((s, w) => s + w.quantity, 0);
  const inStock = wines.filter((w) => w.quantity > 0).length;
  const rated = wines.filter((w) => w.rating);
  const avg = rated.length ? (rated.reduce((s, w) => s + (w.rating || 0), 0) / rated.length).toFixed(1).replace('.', ',') : '–';
  const years = wines.map((w) => w.year).filter((y) => y > 1800);
  const oldest = years.length ? Math.min(...years) : '–';
  const newest = years.length ? Math.max(...years) : '–';

  const stock = wines.filter((w) => w.quantity > 0);
  const priced = stock.filter((w) => w.price != null);
  const value = priced.reduce((sum, w) => sum + (w.price ?? 0) * w.quantity, 0);
  const pricedBottles = priced.reduce((sum, w) => sum + w.quantity, 0);
  const unpricedBottles = stock.reduce((sum, w) => sum + w.quantity, 0) - pricedBottles;
  const estimated = priced.some((w) => w.priceEstimated);
  const priciest = [...priced].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, 3);

  const byType = countBy(wines.map((w) => w.type));
  const countries = countBy(wines.map((w) => w.country)).slice(0, 5);
  const regions = countBy(wines.map((w) => w.region)).slice(0, 5);
  const grapes = topGrapes(wines);
  const words = tasteWords(wines);
  const best = [...rated].sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.year - a.year).slice(0, 5);

  return (
    <Screen title="Overzicht">
      <div className="bg-surface rounded-[14px] grid grid-cols-2">
        <Stat value={bottles} label={bottles === 1 ? 'fles' : 'flessen'} className="border-r border-b border-line" />
        <Stat value={<>{inStock}<span className="text-[17px] font-medium text-muted"> / {wines.length}</span></>} label="wijnen op voorraad" className="border-b border-line" />
        <Stat value={avg} label={`gem. beoordeling (${rated.length})`} className="border-r border-line" />
        <Stat value={<>{oldest}<span className="text-[17px] font-medium text-muted"> – {newest}</span></>} label="jaargangen" />
      </div>

      {priced.length > 0 && (
        <Section
          title="Waarde"
          footer={estimated ? 'Prijzen die Claude heeft opgezocht zijn schattingen van de winkelprijs.' : undefined}
        >
          <Group>
            <div className="px-4 py-3.5 flex flex-col gap-0.5">
              <span className="text-[28px] leading-8 font-bold tracking-tight tabular-nums">{formatPrice(value, true)}</span>
              <span className="text-sm text-muted">
                waarde van je voorraad · gemiddeld {formatPrice(pricedBottles ? value / pricedBottles : 0)} per fles
                {unpricedBottles > 0 && ` · ${unpricedBottles} ${unpricedBottles === 1 ? 'fles' : 'flessen'} zonder prijs`}
              </span>
            </div>
            {priciest.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onOpenWine(w)}
                className="w-full flex justify-between items-center gap-3 min-h-12 px-4 text-left text-[15px] active:bg-control"
              >
                <span className="min-w-0 truncate">{w.name} <span className="text-muted">{w.year}</span></span>
                <span className="tabular-nums shrink-0">{formatPrice(w.price ?? 0)}</span>
              </button>
            ))}
          </Group>
        </Section>
      )}

      <Section title="Soort">
        <div className="bg-surface rounded-[14px] p-4 flex flex-col gap-3.5">
          <div
            role="img"
            aria-label={byType.map((t) => `${typeLabels[t.label as WineType] ?? t.label} ${t.count}`).join(', ')}
            className="flex h-3 rounded-full overflow-hidden gap-0.5"
          >
            {byType.map((t) => (
              <span key={t.label} className={typeBarClass(t.label as WineType)} style={{ flex: t.count }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {byType.map((t) => (
              <span key={t.label} className="flex items-center gap-2">
                <TypeDot type={t.label as WineType} size={8} />
                {typeLabels[t.label as WineType] ?? t.label}
                <span className="ml-auto text-muted tabular-nums">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {countries.length > 0 && <Section title="Landen"><BarList items={countries} /></Section>}
      {regions.length > 0 && <Section title="Regio's"><BarList items={regions} /></Section>}
      {grapes.length > 0 && <Section title="Druiven"><BarList items={grapes} /></Section>}

      {best.length > 0 && (
        <Section title="Hoogst beoordeeld">
          <Group>
            {best.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onOpenWine(w)}
                className="w-full flex justify-between items-center gap-3 min-h-12 px-4 text-left text-[15px] active:bg-control"
              >
                <span className="min-w-0 truncate">{w.name} <span className="text-muted">{w.year}</span></span>
                <span className="text-warn font-semibold tabular-nums">{w.rating},0</span>
              </button>
            ))}
          </Group>
        </Section>
      )}

      {words.length > 0 && (
        <Section title="Wat je proeft">
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <span key={w.label} className="px-2.5 py-1.5 rounded-lg bg-surface text-sm">
                {w.label} <span className="text-muted tabular-nums">{w.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}
