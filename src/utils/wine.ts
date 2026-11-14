import type { Wine } from '../types/wine';

/** Leest "2024-2028" (of "2024 – 2028", "vanaf 2026") als jaartallen */
export function parseDrinkWindow(text?: string): { from: number; to: number } | null {
  if (!text) return null;
  const years = text.match(/(19|20)\d{2}/g)?.map(Number);
  if (!years?.length) return null;
  return { from: Math.min(...years), to: Math.max(...years) };
}

export type DrinkStatus = 'jong' | 'op-dronk' | 'over' | 'onbekend';

export function drinkStatus(wine: Pick<Wine, 'bestBefore'>, year = new Date().getFullYear()): DrinkStatus {
  const win = parseDrinkWindow(wine.bestBefore);
  if (!win) return 'onbekend';
  if (year < win.from) return 'jong';
  if (year > win.to) return 'over';
  return 'op-dronk';
}

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const euroRound = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function formatPrice(value: number, round = false): string {
  return (round ? euroRound : euro).format(value);
}

/** Leest "12,95", "€ 12.95" of "12" als bedrag; leeg of ongeldig = undefined */
export function parsePriceInput(text: string): number | undefined {
  const cleaned = text.replace(/[€\s]/g, '').replace(',', '.');
  if (!cleaned) return undefined;
  const value = Number(cleaned);
  return isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : undefined;
}

export function priceInputValue(value?: number): string {
  return value == null ? '' : value.toFixed(2).replace('.', ',');
}
