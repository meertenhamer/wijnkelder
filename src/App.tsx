import { useState, useEffect } from 'react';
import type { Wine, WineLocation } from './types/wine';
import { storage, NotLoggedInError, type Me } from './services/storage';
import { TabBar, type Tab } from './components/TabBar';
import { CellarScreen } from './components/CellarScreen';
import { WineDetail } from './components/WineDetail';
import { AddWineSheet } from './components/AddWineSheet';
import { FoodPairing } from './components/FoodPairing';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Spinner } from './components/ui';

function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('kelder');
  const [wines, setWines] = useState<Wine[]>([]);
  const [locations, setLocations] = useState<WineLocation[]>([]);
  // Geopende wijn (scherm dat over de tabbladen heen schuift) en het toevoeg-venster
  const [openWineId, setOpenWineId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Inloggen gebeurt door Cloudflare Access voordat de app laadt.
  // Hier halen we alleen op wie er is ingelogd, plus de wijnen en locaties.
  useEffect(() => {
    storage.getMe()
      .then(async (user) => {
        const [w, l] = await Promise.all([storage.getWines(), storage.getLocations()]);
        setWines(w);
        setLocations(l);
        setMe(user);
      })
      .catch((err) => {
        console.error('Kon gebruiker niet laden:', err);
        setLoadError(
          err instanceof NotLoggedInError
            ? 'Je bent niet (meer) ingelogd.'
            : 'Kan de server niet bereiken.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddLocation = async (name: string): Promise<WineLocation | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // Voorkom dubbele locaties (hoofdletterongevoelig)
    const existing = locations.find((l) => l.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const created = await storage.addLocation(trimmed);
    if (created) {
      setLocations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'nl')));
    }
    return created;
  };

  const handleDeleteLocation = async (id: string) => {
    const ok = await storage.deleteLocation(id);
    if (ok) setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateWine = (updated: Wine) => {
    setWines((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleDeleteWine = (id: string) => {
    setWines((prev) => prev.filter((w) => w.id !== id));
    setOpenWineId(null);
  };

  const handleSaved = (wine: Wine) => {
    setWines((prev) => [wine, ...prev]);
    setAdding(false);
    setTab('kelder');
    setOpenWineId(wine.id);
  };

  const handleLogout = () => {
    // Uitloggen bij Cloudflare Access
    window.location.href = '/cdn-cgi/access/logout';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        <Spinner className="w-6 h-6" />
        <span className="sr-only">Laden…</span>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-[17px] font-semibold">{loadError ?? 'Er ging iets mis.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 px-6 rounded-[10px] bg-wine active:bg-wine-dark text-white text-base font-semibold"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const openWine = openWineId ? wines.find((w) => w.id === openWineId) : undefined;

  return (
    <>
      {openWine ? (
        <WineDetail
          key={openWine.id}
          wine={openWine}
          locations={locations}
          onAddLocation={handleAddLocation}
          onBack={() => setOpenWineId(null)}
          onUpdate={handleUpdateWine}
          onDelete={handleDeleteWine}
        />
      ) : (
        <>
          {tab === 'kelder' && (
            <CellarScreen
              wines={wines}
              locations={locations}
              onOpenWine={(w) => setOpenWineId(w.id)}
              onAdd={() => setAdding(true)}
            />
          )}
          {tab === 'spijs' && <FoodPairing wines={wines} onOpenWine={(w) => setOpenWineId(w.id)} />}
          {tab === 'overzicht' && <Dashboard wines={wines} onOpenWine={(w) => setOpenWineId(w.id)} />}
          {tab === 'instellingen' && (
            <Settings
              me={me}
              wines={wines}
              locations={locations}
              onAddLocation={handleAddLocation}
              onDeleteLocation={handleDeleteLocation}
              onLogout={handleLogout}
            />
          )}
          <TabBar active={tab} onChange={setTab} />
        </>
      )}

      {adding && (
        <AddWineSheet
          locations={locations}
          onAddLocation={handleAddLocation}
          onCancel={() => setAdding(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

export default App;
