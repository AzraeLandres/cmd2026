import { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileContextValue {
  favorites:     string[];
  addFavorite:   (team: string) => void;
  removeFavorite:(team: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const STORAGE_KEY = 'cdm_favorites';

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  function addFavorite(team: string) {
    setFavorites((prev) => {
      if (prev.includes(team)) return prev;
      const updated = [...prev, team];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function removeFavorite(team: string) {
    setFavorites((prev) => {
      const updated = prev.filter((t) => t !== team);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
