import { useState, useEffect } from 'react';
import type { Wine } from './types/wine';
import type { User } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import { storage } from './services/storage';
import { AuthPage } from './components/AuthPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { HomePage } from './components/HomePage';
import { NewWineForm } from './components/NewWineForm';
import { WineCellar } from './components/WineCellar';

type Page = 'home' | 'new' | 'cellar';

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

      // Show reset password page when user comes from recovery link
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load wines when user is authenticated
  useEffect(() => {
    if (user && !showResetPassword) {
      loadWines();
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
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
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
    default:
      return <HomePage onNavigate={setPage} onLogout={handleLogout} userEmail={user.email} />;
  }
}

export default App;
