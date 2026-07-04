import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useHeader } from '../App';
import { GET_MATCHES } from '../graphql/queries';
import EmptyState from '../atoms/EmptyState';

export default function Teams() {
  const setHeader = useHeader();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setHeader({ title: 'Équipes', showBack: false, liveMinute: null });
  }, [setHeader]);

  const { data, loading, error } = useQuery(GET_MATCHES);

  const allTeams = useMemo(() => {
    const matches = data?.matches ?? [];
    const teamSet = new Set<string>();
    for (const m of matches) {
      if (m.homeTeam) teamSet.add(m.homeTeam);
      if (m.awayTeam) teamSet.add(m.awayTeam);
    }
    return Array.from(teamSet).sort();
  }, [data]);

  if (error)   return <EmptyState role="alert">Impossible de charger les équipes.</EmptyState>;
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const filtered = allTeams.filter((t) => t.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <input
        className="search-box"
        type="search"
        placeholder="Rechercher une équipe…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher une équipe participante"
      />
      {filtered.length === 0 && <EmptyState>Aucune équipe ne correspond à votre recherche.</EmptyState>}
      <div role="list" aria-label="Liste des équipes">
        {filtered.map((team) => (
          <div role="listitem" key={team}>
            <Link
              to={`/equipe/${encodeURIComponent(team)}`}
              className="card phase-card"
              aria-label={`Voir le détail de ${team}`}
            >
              <div className="title">{team}</div>
              <span className="chevron" aria-hidden="true">›</span>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
