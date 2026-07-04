import { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar    from './organisms/TopBar';
import BottomNav from './organisms/BottomNav';
import ChatBot   from './organisms/ChatBot';
import ModeBanner from './organisms/ModeBanner';
import { useAuth }  from './AuthContext';
import AuthPage from './pages/AuthPage';

interface HeaderState {
  title:      string;
  showBack:   boolean;
  liveMinute: number | null;
}

type SetHeader = (state: Partial<HeaderState>) => void;

const HeaderContext = createContext<SetHeader>(() => {});
export function useHeader(): SetHeader { return useContext(HeaderContext); }

export default function App() {
  const { user } = useAuth();
  const [header, setHeader] = useState<HeaderState>({
    title:      'Coupe du Monde 2026',
    showBack:   false,
    liveMinute: null,
  });

  function updateHeader(partial: Partial<HeaderState>) {
    setHeader((prev) => ({ ...prev, ...partial }));
  }

  if (!user) return <AuthPage />;

  return (
    <HeaderContext.Provider value={updateHeader}>
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>
      <div className="app-shell">
        <ModeBanner />
        <TopBar title={header.title} showBack={header.showBack} liveMinute={header.liveMinute} />
        <main className="view" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <BottomNav />
        <ChatBot />
      </div>
    </HeaderContext.Provider>
  );
}
