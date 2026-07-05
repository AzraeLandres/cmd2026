import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from './AuthContext';
import { GET_FAVORITES } from '@graphql/queries';
import { ADD_FAVORITE, REMOVE_FAVORITE } from '@graphql/mutations';

interface ProfileContextValue {
  favorites:     string[];
  addFavorite:   (team: string) => void;
  removeFavorite:(team: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function legacyStorageKey(username: string): string {
  return `cdm_favorites_${username}`;
}

function readLegacyFavorites(username: string): string[] {
  try {
    const stored = localStorage.getItem(legacyStorageKey(username));
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const migratedUsers = useRef(new Set<string>());

  const { data, refetch } = useQuery<{ favorites: string[] }>(GET_FAVORITES, {
    skip: !user,
    fetchPolicy: 'cache-and-network',
  });
  const [addFavoriteMutation] = useMutation<{ addFavorite: string[] }>(ADD_FAVORITE);
  const [removeFavoriteMutation] = useMutation<{ removeFavorite: string[] }>(REMOVE_FAVORITE);

  const favorites = data?.favorites ?? [];

  // Migration ponctuelle : les favoris étaient auparavant stockés en localStorage.
  // On les pousse en base une fois puis on nettoie le stockage local.
  useEffect(() => {
    if (!user || migratedUsers.current.has(user.username)) return;
    migratedUsers.current.add(user.username);

    const legacy = readLegacyFavorites(user.username);
    if (legacy.length === 0) return;

    (async () => {
      for (const team of legacy) {
        await addFavoriteMutation({ variables: { team } });
      }
      localStorage.removeItem(legacyStorageKey(user.username));
      refetch();
    })();
  }, [user, addFavoriteMutation, refetch]);

  function addFavorite(team: string) {
    if (favorites.includes(team)) return;
    addFavoriteMutation({
      variables: { team },
      optimisticResponse: { addFavorite: [...favorites, team] },
      update(cache, { data }) {
        if (!data) return;
        cache.writeQuery({ query: GET_FAVORITES, data: { favorites: data.addFavorite } });
      },
    });
  }

  function removeFavorite(team: string) {
    removeFavoriteMutation({
      variables: { team },
      optimisticResponse: { removeFavorite: favorites.filter((t) => t !== team) },
      update(cache, { data }) {
        if (!data) return;
        cache.writeQuery({ query: GET_FAVORITES, data: { favorites: data.removeFavorite } });
      },
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
