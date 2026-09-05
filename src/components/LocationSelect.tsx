import { useState } from 'react';
import type { WineLocation } from '../types/wine';

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  locations: WineLocation[];
  onAddLocation: (name: string) => Promise<WineLocation | null>;
}

// Sentinel-waarde voor de "nieuwe locatie toevoegen"-optie in de dropdown
const ADD_NEW = '__add_new__';

export function LocationSelect({ value, onChange, locations, onAddLocation }: LocationSelectProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectChange = (selected: string) => {
    if (selected === ADD_NEW) {
      setAdding(true);
      setNewName('');
    } else {
      onChange(selected);
    }
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    setSaving(true);
    const created = await onAddLocation(trimmed);
    setSaving(false);
    if (created) {
      onChange(created.name);
    }
    setAdding(false);
    setNewName('');
  };

  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          autoFocus
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="bijv. Klimaatkast"
          className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-medium px-4 rounded-xl transition-all"
        >
          {saving ? '...' : 'Ok'}
        </button>
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setNewName('');
          }}
          className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium px-4 rounded-xl transition-all"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => handleSelectChange(e.target.value)}
      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-900"
    >
      <option value="">Geen locatie</option>
      {locations.map((loc) => (
        <option key={loc.id} value={loc.name}>
          {loc.name}
        </option>
      ))}
      {value && !locations.some((l) => l.name === value) && (
        <option value={value}>{value}</option>
      )}
      <option value={ADD_NEW}>+ Nieuwe locatie…</option>
    </select>
  );
}
