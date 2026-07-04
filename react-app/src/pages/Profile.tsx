import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useHeader }  from '../App';
import { useProfile } from '../ProfileContext';
import { useAuth }    from '../AuthContext';
import { GET_MATCHES } from '../graphql/queries';
import FriendsSection from '../organisms/FriendsSection';

export default function Profile() {
  const setHeader              = useHeader();
  const { favorites, addFavorite, removeFavorite } = useProfile();
  const { user, logout }       = useAuth();
  const [search, setSearch]    = useState('');

  useEffect(() => {
    setHeader({ title: 'Profil', showBack: false, liveMinute: null });
  }, [setHeader]);

  const { data } = useQuery(GET_MATCHES);
  const allTeams = useMemo(() => {
    const matches = data?.matches ?? [];
    const teamSet = new Set<string>();
    for (const m of matches) {
      if (m.homeTeam) teamSet.add(m.homeTeam);
      if (m.awayTeam) teamSet.add(m.awayTeam);
    }
    return Array.from(teamSet).sort();
  }, [data]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? allTeams.filter((t) => t.toLowerCase().includes(q)) : allTeams;
  }, [allTeams, search]);

  const initial      = (user!.displayName || user!.username || '?')[0].toUpperCase();
  const displayLabel = user!.displayName || user!.username;

  return (
    <>
      <div className="profile-account-card">
        <div className="profile-avatar" aria-hidden="true">{initial}</div>
        <div>
          <div className="profile-name">{displayLabel}</div>
          <div className="profile-handle">@{user!.username}</div>
        </div>
      </div>

      <FriendsSection />

      <section aria-label="Équipes favorites">
        <div className="profile-fav-header">
          <h2 className="section-title" style={{ margin: 0 }}>Équipes favorites</h2>
          <input
            className="profile-fav-search"
            type="search"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher une équipe"
          />
        </div>

        {favorites.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
            {favorites.map((team) => (
              <li key={team} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{team}</span>
                <button
                  onClick={() => removeFavorite(team)}
                  aria-label={`Retirer ${team} des favoris`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}

        {filteredTeams.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredTeams.filter((t) => !favorites.includes(t)).map((team) => (
              <li key={team} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.88rem' }}>{team}</span>
                <button
                  onClick={() => addFavorite(team)}
                  aria-label={`Ajouter ${team} aux favoris`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary)' }}
                >
                  ＋
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="btn-logout" onClick={logout}>
        Se déconnecter
      </button>
    </>
  );
}
