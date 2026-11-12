import { useState } from 'react';
import type { Wine } from '../types/wine';
import { getFoodPairing } from '../services/ai';
import { Chevron, ErrorNote, Group, Screen, Section, Spinner } from './ui';

interface FoodPairingProps {
  wines: Wine[];
  onOpenWine: (wine: Wine) => void;
}

interface Recommendation {
  wine: Wine;
  reason: string;
  score: number;
}

export function FoodPairing({ wines, onOpenWine }: FoodPairingProps) {
  const [dish, setDish] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ dish: string; recommendations: Recommendation[]; advice: string } | null>(null);

  const available = wines.filter((w) => w.quantity > 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!dish.trim()) {
      setError('Beschrijf eerst wat je gaat eten');
      return;
    }
    if (available.length === 0) {
      setError('Je hebt geen wijnen op voorraad.');
      return;
    }
    setLoading(true);
    try {
      const r = await getFoodPairing(dish.trim(), available);
      setResult({ dish: dish.trim(), recommendations: r.recommendations, advice: r.generalAdvice });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Spijs & wijn"
      subtitle={`Kiest uit de ${available.length} ${available.length === 1 ? 'wijn' : 'wijnen'} die je op voorraad hebt`}
    >
      <form onSubmit={handleSearch} className="bg-surface rounded-[14px] px-4 py-3.5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Wat eet je?</span>
          <textarea
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            placeholder="bijv. Lamsrack met rozemarijn en geroosterde groenten"
            className="bg-transparent text-[17px] leading-6 text-ink placeholder:text-muted/70 outline-none resize-none"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-[10px] bg-wine active:bg-wine-dark disabled:bg-wine/60 text-white text-base font-semibold flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? 'Even denken…' : 'Zoek een wijn'}
        </button>
      </form>

      {error && <ErrorNote>{error}</ErrorNote>}

      {result && !loading && (
        <>
          <Section title="Uit je kelder">
            {result.recommendations.length === 0 ? (
              <Group>
                <p className="px-4 py-3.5 text-[15px] text-muted">Er past niets uit je kelder echt goed bij dit gerecht.</p>
              </Group>
            ) : (
              <Group>
                {result.recommendations.map((rec, i) => (
                  <button
                    key={rec.wine.id}
                    type="button"
                    onClick={() => onOpenWine(rec.wine)}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-control"
                  >
                    <span className="w-10 shrink-0 flex flex-col items-center">
                      <span className={`text-xl font-bold tabular-nums ${i === 0 && rec.score >= 80 ? 'text-ok' : ''}`}>{rec.score}</span>
                      <span className="text-[11px] text-muted">match</span>
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-base font-semibold">{rec.wine.name}</span>
                      <span className="text-sm text-muted">
                        {[rec.wine.year, rec.wine.region, `${rec.wine.quantity} fl.`, rec.wine.location].filter(Boolean).join(' · ')}
                      </span>
                      <span className="text-sm leading-5 text-stone-700 mt-0.5">{rec.reason}</span>
                    </span>
                    <Chevron />
                  </button>
                ))}
              </Group>
            )}
          </Section>
          {result.advice && <p className="text-sm leading-5 text-muted px-1 -mt-3">{result.advice}</p>}
        </>
      )}
    </Screen>
  );
}
