import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useHeader } from "../App";
import { GET_MATCHES } from "../graphql/queries";
import MatchCard from "../molecules/MatchCard";
import EmptyState from "../atoms/EmptyState";

interface Player {
  name: string;
  position?: string;
  shirtNumber?: number;
}

interface PlayerStat {
  name: string;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
}

export default function TeamDetail() {
  const { name } = useParams<{ name: string }>();
  const setHeader = useHeader();

  useEffect(() => {
    setHeader({ title: name ?? "", showBack: true, liveMinute: null });
  }, [setHeader, name]);

  const { data, loading, error } = useQuery(GET_MATCHES);

  if (error)
    return (
      <EmptyState role="alert">Impossible de charger les données.</EmptyState>
    );
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const matches = (data?.matches ?? []).filter(
    (m: { homeTeam: string; awayTeam: string }) =>
      m.homeTeam === name || m.awayTeam === name,
  );
  const sortedMatches = [...matches].sort(
    (a: { date: string }, b: { date: string }) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const squad: Player[] = [];
  const stats: PlayerStat[] = [];

  return (
    <>
      <section className="home-section" aria-label={`Effectif de ${name}`}>
        <h2 className="section-title">Effectif</h2>
        {squad.length === 0 ? (
          <EmptyState>Composition non encore disponible.</EmptyState>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" className="num">
                  N°
                </th>
                <th scope="col">Joueur</th>
                <th scope="col">Poste</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p, i) => (
                <tr key={i}>
                  <td className="num">{p.shirtNumber ?? "—"}</td>
                  <td>{p.name}</td>
                  <td>{p.position ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {stats.length > 0 && (
        <section
          className="home-section"
          aria-label={`Statistiques de ${name}`}
        >
          <h2 className="section-title">Statistiques</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th className="num">Buts</th>
                <th className="num">Passes D.</th>
                <th className="num" aria-label="Cartons jaunes">
                  🟨
                </th>
                <th className="num" aria-label="Cartons rouges">
                  🟥
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td className="num">{p.goals}</td>
                  <td className="num">{p.assists}</td>
                  <td className="num">{p.yellow}</td>
                  <td className="num">{p.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="home-section" aria-label={`Matchs de ${name}`}>
        <h2 className="section-title">Matchs</h2>
        {sortedMatches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </section>
    </>
  );
}
