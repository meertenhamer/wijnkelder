import { useState, useEffect } from 'react';
import type { Wine, WineLocation } from './types/wine';
import { storage, NotLoggedInError, type Me } from './services/storage';
import { HomePage } from './components/HomePage';
import { NewWineForm } from './components/NewWineForm';
import { WineCellar } from './components/WineCellar';
import { WineSearch } from './components/WineSearch';
import { FoodPairing } from './components/FoodPairing';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';

type Page = 'home' | 'new' | 'cellar' | 'search' | 'pairing' | 'settings' | 'dashboard';

function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [wines, setWines] = useState<Wine[]>([]);
  const [locations, setLocations] = useState<WineLocation[]>([]);

  // Inloggen gebeurt door Cloudflare Access voordat de app laadt.
  // Hier halen we alleen op wie er is ingelogd, plus de wijnen en locaties.
  useEffect(() => {
    storage.getMe()
      .then((user) => {
        setMe(user);
        loadWines();
        loadLocations();
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

  const loadWines = async () => {
    const wines = await storage.getWines();
    setWines(wines);
  };

  const loadLocations = async () => {
    const locations = await storage.getLocations();
    setLocations(locations);
  };

  const handleAddLocation = async (name: string): Promise<WineLocation | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // Voorkom dubbele locaties (hoofdletterongevoelig)
    const existing = locations.find(
      (l) => l.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const created = await storage.addLocation(trimmed);
    if (created) {
      setLocations([...locations, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return created;
  };

  const handleDeleteLocation = async (id: string) => {
    const ok = await storage.deleteLocation(id);
    if (ok) {
      setLocations(locations.filter((l) => l.id !== id));
    }
  };

  const handleSaveWine = (wine: Wine) => {
    setWines([wine, ...wines]);
    setPage('cellar');
  };

  const handleUpdateWine = (updatedWine: Wine) => {
    setWines(wines.map(w => w.id === updatedWine.id ? updatedWine : w));
  };

  const handleDeleteWine = (id: string) => {
    setWines(wines.filter(w => w.id !== id));
  };

  const handleLogout = () => {
    // Uitloggen bij Cloudflare Access
    window.location.href = '/cdn-cgi/access/logout';
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="flex-1 overflow-hidden bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Laden...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex-1 overflow-hidden bg-stone-100 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-stone-600">{loadError ?? 'Er ging iets mis.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-900 hover:bg-red-800 text-white font-semibold py-3 px-6 rounded-2xl"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // Main app
  switch (page) {
    case 'new':
      return (
        <NewWineForm
          onBack={() => setPage('home')}
          onSave={handleSaveWine}
          locations={locations}
          onAddLocation={handleAddLocation}
        />
      );
    case 'cellar':
      return (
        <WineCellar
          wines={wines}
          onBack={() => setPage('home')}
          onUpdate={handleUpdateWine}
          onDelete={handleDeleteWine}
          locations={locations}
          onAddLocation={handleAddLocation}
        />
      );
    case 'search':
      return (
        <WineSearch
          onBack={() => setPage('home')}
          onAddWine={(wine) => setWines([wine, ...wines])}
        />
      );
    case 'pairing':
      return (
        <FoodPairing
          wines={wines}
          onBack={() => setPage('home')}
        />
      );
    case 'settings':
      return (
        <Settings
          me={me}
          onBack={() => setPage('home')}
          locations={locations}
          onAddLocation={handleAddLocation}
          onDeleteLocation={handleDeleteLocation}
        />
      );
    case 'dashboard':
      return (
        <Dashboard
          wines={wines}
          onBack={() => setPage('home')}
        />
      );
    default:
      return <HomePage onNavigate={setPage} onLogout={handleLogout} userEmail={me.email} />;
  }
}

export default App;
