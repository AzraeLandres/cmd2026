import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  favorites:     string[];
  addFavorite:   (team: string) => void;
  removeFavorite:(team: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function storageKey(username: string | undefined): string {
  return `cdm_favorites_${username ?? 'guest'}`;
}

function loadFavorites(username: string | undefined): string[] {
  try {
    const stored = localStorage.getItem(storageKey(username));
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() =>
    loadFavorites(user?.username),
  );

  useEffect(() => {
    setFavorites(loadFavorites(user?.username));
  }, [user?.username]);

  function addFavorite(team: string) {
    setFavorites((prev) => {
      if (prev.includes(team)) return prev;
      const updated = [...prev, team];
      localStorage.setItem(storageKey(user?.username), JSON.stringify(updated));
      return updated;
    });
  }

  function removeFavorite(team: string) {
    setFavorites((prev) => {
      const updated = prev.filter((t) => t !== team);
      localStorage.setItem(storageKey(user?.username), JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <ProfileContext.Provider value={{ favorites, addFavorite, removeFavorite }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
