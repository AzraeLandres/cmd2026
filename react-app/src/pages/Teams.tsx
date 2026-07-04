import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_MATCHES } from "@graphql/queries";
import EmptyState from "@atoms/EmptyState";
import { CARD, INPUT } from "@utils/ui";

export default function Teams() {
  const [query, setQuery] = useState("");

  const { data, loading, error } = useQuery(GET_MATCHES, {
    fetchPolicy: "cache-and-network",
  });

  const allTeams = useMemo(() => {
    const matches = data?.matches ?? [];
    const teamSet = new Set<string>();
    for (const m of matches) {
      if (m.homeTeam) teamSet.add(m.homeTeam);
      if (m.awayTeam) teamSet.add(m.awayTeam);
    }
    return Array.from(teamSet).sort();
  }, [data]);

  if (error)
    return (
      <EmptyState role="alert">Impossible de charger les équipes.</EmptyState>
    );
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const filtered = allTeams.filter((t) =>
    t.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <input
        className={`${INPUT} mb-3.5 w-full`}
        type="search"
        placeholder="Rechercher une équipe…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher une équipe participante"
      />
      {filtered.length === 0 && (
        <EmptyState>Aucune équipe ne correspond à votre recherche.</EmptyState>
      )}
      <div role="list" aria-label="Liste des équipes">
        {filtered.map((team) => (
          <div role="listitem" key={team}>
            <Link
              to={`/equipe/${encodeURIComponent(team)}`}
              className={`${CARD} flex items-center justify-between`}
              aria-label={`Voir le détail de ${team}`}
            >
              <div className="text-sm font-semibold">{team}</div>
              <span className="text-lg text-textMuted" aria-hidden="true">
                ›
              </span>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
