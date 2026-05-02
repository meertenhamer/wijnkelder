import { useState, useEffect } from 'react';
import type { Wine } from './types/wine';
import type { User } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import { App as CapApp } from '@capacitor/app';
import { storage } from './services/storage';
import { AuthPage } from './components/AuthPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { HomePage } from './components/HomePage';
import { NewWineForm } from './components/NewWineForm';
import { WineCellar } from './components/WineCellar';
import { WineSearch } from './components/WineSearch';
import { FoodPairing } from './components/FoodPairing';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';

type Page = 'home' | 'new' | 'cellar' | 'search' | 'pairing' | 'settings' | 'dashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>('home');
  const [wines, setWines] = useState<Wine[]>([]);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    console.log('App mounted, checking session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session result:', session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Session error:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
      }
    });

    // Verwerk Supabase auth deep links in de native iOS app (bijv. wachtwoord reset)
    let appUrlListener: (() => void) | undefined;
    CapApp.addListener('appUrlOpen', ({ url }) => {
      if (url.includes('access_token') || url.includes('type=recovery')) {
        const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    }).then(handle => {
      appUrlListener = () => handle.remove();
    });

    return () => {
      subscription.unsubscribe();
      appUrlListener?.();
    };
  }, []);

  // Load wines and API key when user is authenticated
  useEffect(() => {
    if (user && !showResetPassword) {
      loadWines();
      // Laad API key van Supabase
      storage.loadApiKey();
    } else {
      setWines([]);
    }
  }, [user, showResetPassword]);

  const loadWines = async () => {
    const wines = await storage.getWines();
    setWines(wines);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage('home');
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="flex-1 overflow-hidden bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Laden...</p>
      </div>
    );
  }

  // Show reset password page
  if (showResetPassword && user) {
    return (
      <ResetPasswordPage
        onSuccess={() => setShowResetPassword(false)}
      />
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Main app
  switch (page) {
    case 'new':
      return (
        <NewWineForm
          onBack={() => setPage('home')}
          onSave={handleSaveWine}
        />
      );
    case 'cellar':
      return (
        <WineCellar
          wines={wines}
          onBack={() => setPage('home')}
          onUpdate={handleUpdateWine}
          onDelete={handleDeleteWine}
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
          onBack={() => setPage('home')}
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
      return <HomePage onNavigate={setPage} onLogout={handleLogout} userEmail={user.email} />;
  }
}

export default App;
