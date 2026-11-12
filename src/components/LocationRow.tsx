import type { WineLocation } from '../types/wine';
import { Chevron } from './ui';

// Sentinel-waarde voor de optie "Nieuwe locatie…"
const ADD_NEW = '__add_new__';

interface LocationRowProps {
  value: string;
  onChange: (value: string) => void;
  locations: WineLocation[];
  onAddLocation: (name: string) => Promise<WineLocation | null>;
}

/**
 * Lijstregel "Locatie" die het native keuzemenu van het toestel opent
 * (op de iPhone het draaiwiel), met een optie om een nieuwe locatie te maken.
 */
export function LocationRow({ value, onChange, locations, onAddLocation }: LocationRowProps) {
  const handleChange = async (selected: string) => {
    if (selected !== ADD_NEW) {
      onChange(selected);
      return;
    }
    const name = window.prompt('Naam van de nieuwe locatie', '')?.trim();
    if (!name) return;
    const created = await onAddLocation(name);
    if (created) onChange(created.name);
  };

  return (
    <label className="relative w-full flex items-center justify-between gap-4 min-h-12 px-4">
      <span className="text-base">Locatie</span>
      <span className="flex items-center gap-2 text-muted text-[15px]">
        {value || 'Geen'}
        <Chevron />
      </span>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
        aria-label="Locatie"
      >
        <option value="">Geen locatie</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.name}>{loc.name}</option>
        ))}
        {value && !locations.some((l) => l.name === value) && <option value={value}>{value}</option>}
        <option value={ADD_NEW}>Nieuwe locatie…</option>
      </select>
    </label>
  );
}
