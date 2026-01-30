import { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check je email om je account te bevestigen!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-stone-800 mb-2">Wijnkelder</h1>
          <p className="text-stone-500">
            {isLogin ? 'Log in om je wijnen te beheren' : 'Maak een account aan'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div>
            <label className="block text-stone-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="jouw@email.nl"
              required
            />
          </div>

          <div>
            <label className="block text-stone-700 text-sm font-medium mb-2">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-900"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-300 rounded-xl p-3 text-green-800 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            {loading ? 'Even geduld...' : isLogin ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>

        <p className="text-center mt-6 text-stone-600">
          {isLogin ? 'Nog geen account?' : 'Al een account?'}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="text-red-900 font-semibold hover:underline"
          >
            {isLogin ? 'Registreren' : 'Inloggen'}
          </button>
        </p>
      </div>
    </div>
  );
}
