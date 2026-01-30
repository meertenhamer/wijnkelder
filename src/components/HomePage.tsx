interface HomePageProps {
  onNavigate: (page: 'new' | 'cellar' | 'search' | 'pairing') => void;
  onLogout?: () => void;
  userEmail?: string;
}

export function HomePage({ onNavigate, onLogout, userEmail }: HomePageProps) {
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6">
      {userEmail && (
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <span className="text-stone-500 text-sm">{userEmail}</span>
          <button
            onClick={onLogout}
            className="text-stone-500 hover:text-stone-700 text-sm underline"
          >
            Uitloggen
          </button>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-stone-800 mb-4">Wijnkelder</h1>
        <p className="text-stone-500 text-lg">Beheer je wijnvoorraad</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onNavigate('new')}
          className="bg-red-900 hover:bg-red-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span className="text-2xl mr-3">+</span>
          Nieuwe Wijn
        </button>

        <button
          onClick={() => onNavigate('cellar')}
          className="bg-red-900 hover:bg-red-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span className="text-2xl mr-3">🍷</span>
          Wijnkelder
        </button>

        <button
          onClick={() => onNavigate('search')}
          className="bg-red-900 hover:bg-red-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span className="text-2xl mr-3">🔍</span>
          Zoek een Wijn
        </button>

        <button
          onClick={() => onNavigate('pairing')}
          className="bg-red-900 hover:bg-red-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span className="text-2xl mr-3">🍽️</span>
          Wijn/Spijs Combinatie
        </button>
      </div>
    </div>
  );
}
