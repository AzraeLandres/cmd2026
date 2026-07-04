import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_MATCHES } from "@graphql/queries";
import MatchCard from "@molecules/MatchCard";
import EmptyState from "@atoms/EmptyState";
import SectionTitle from "@atoms/SectionTitle";
import {
  SECTION,
  DATA_TABLE,
  DATA_TABLE_TH,
  DATA_TABLE_TD,
  DATA_TABLE_NUM,
} from "@utils/ui";

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

  const { data, loading, error } = useQuery(GET_MATCHES, {
    fetchPolicy: "cache-and-network",
  });

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
      <section className={SECTION} aria-label={`Effectif de ${name}`}>
        <SectionTitle>Effectif</SectionTitle>
        {squad.length === 0 ? (
          <EmptyState>Composition non encore disponible.</EmptyState>
        ) : (
          <table className={DATA_TABLE}>
            <thead>
              <tr>
                <th scope="col" className={`${DATA_TABLE_TH} ${DATA_TABLE_NUM}`}>
                  N°
                </th>
                <th scope="col" className={DATA_TABLE_TH}>Joueur</th>
                <th scope="col" className={DATA_TABLE_TH}>Poste</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p, i) => (
                <tr key={i}>
                  <td className={`${DATA_TABLE_TD} ${DATA_TABLE_NUM}`}>
                    {p.shirtNumber ?? "—"}
                  </td>
                  <td className={DATA_TABLE_TD}>{p.name}</td>
                  <td className={DATA_TABLE_TD}>{p.position ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {stats.length > 0 && (
        <section className={SECTION} aria-label={`Statistiques de ${name}`}>
          <SectionTitle>Statistiques</SectionTitle>
          <table className={DATA_TABLE}>
            <thead>
              <tr>
                <th className={DATA_TABLE_TH}>Joueur</th>
                <th className={`${DATA_TABLE_TH} ${DATA_TABLE_NUM}`}>Buts</th>
                <th className={`${DATA_TABLE_TH} ${DATA_TABLE_NUM}`}>
                  Passes D.
                </th>
                <th
                  className={`${DATA_TABLE_TH} ${DATA_TABLE_NUM}`}
                  aria-label="Cartons jaunes"
                >
                  🟨
                </th>
                <th
                  className={`${DATA_TABLE_TH} ${DATA_TABLE_NUM}`}
                  aria-label="Cartons rouges"
                >
                  🟥
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((p, i) => (
                <tr key={i}>
                  <td className={DATA_TABLE_TD}>{p.name}</td>
                  <td className={`${DATA_TABLE_TD} ${DATA_TABLE_NUM}`}>
                    {p.goals}
                  </td>
                  <td className={`${DATA_TABLE_TD} ${DATA_TABLE_NUM}`}>
                    {p.assists}
                  </td>
                  <td className={`${DATA_TABLE_TD} ${DATA_TABLE_NUM}`}>
                    {p.yellow}
                  </td>
                  <td className={`${DATA_TABLE_TD} ${DATA_TABLE_NUM}`}>
                    {p.red}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className={SECTION} aria-label={`Matchs de ${name}`}>
        <SectionTitle>Matchs</SectionTitle>
        {sortedMatches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </section>
    </>
  );
}
