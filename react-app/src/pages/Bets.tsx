import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_ALL_BETS, GET_MATCHES } from "@graphql/queries";
import EmptyState from "@atoms/EmptyState";
import SectionTitle from "@atoms/SectionTitle";
import {
  DATA_TABLE,
  DATA_TABLE_TH,
  DATA_TABLE_TD,
  DATA_TABLE_NUM,
} from "@utils/ui";

interface BetEntry {
  matchId: string;
  homeScore: number;
  awayScore: number;
  userId: number;
  username: string;
  displayName: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

function computePoints(bet: BetEntry, match: Match): number | null {
  if (match.status !== "FINISHED") return null;
  const exactScore =
    bet.homeScore === match.homeScore && bet.awayScore === match.awayScore;
  const rightWinner =
    Math.sign(bet.homeScore - bet.awayScore) ===
    Math.sign(match.homeScore - match.awayScore);
  if (exactScore) return 3;
  if (rightWinner) return 1;
  return 0;
}

export default function Bets() {
  const { data: matchData, loading: matchLoading } = useQuery<{
    matches: Match[];
  }>(GET_MATCHES);
  const { data: betsData, loading: betsLoading } = useQuery<{
    allBets: BetEntry[];
  }>(GET_ALL_BETS);

  const loading = matchLoading || betsLoading;
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const matches = matchData?.matches ?? [];
  const allBets = betsData?.allBets ?? [];

  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const leaderboard = allBets.reduce<
    Map<string, { displayName: string; points: number }>
  >((acc, bet) => {
    const match = matchMap.get(bet.matchId);
    const points = match ? (computePoints(bet, match) ?? 0) : 0;
    const entry = acc.get(bet.username) ?? {
      displayName: bet.displayName,
      points: 0,
    };
    entry.points += points;
    acc.set(bet.username, entry);
    return acc;
  }, new Map());

  const sorted = Array.from(leaderboard.entries()).sort(
    (a, b) => b[1].points - a[1].points,
  );

  return (
    <>
      <SectionTitle>Classement</SectionTitle>
      {sorted.length === 0 ? (
        <EmptyState>Aucun pari enregistré.</EmptyState>
      ) : (
        <table className={DATA_TABLE} aria-label="Classement des paris">
          <thead>
            <tr>
              <th className={DATA_TABLE_TH}>#</th>
              <th className={DATA_TABLE_TH}>Joueur</th>
              <th className={`${DATA_TABLE_TH} ${DATA_TABLE_NUM}`}>Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([username, { displayName, points }], index) => (
              <tr key={username}>
                <td className={DATA_TABLE_TD}>{index + 1}</td>
                <td className={DATA_TABLE_TD}>{displayName || username}</td>
                <td className={`${DATA_TABLE_TD} ${DATA_TABLE_NUM}`}>
                  {points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SectionTitle className="mt-6">Tous les paris</SectionTitle>
      {allBets.length === 0 ? (
        <EmptyState>Aucun pari pour l'instant.</EmptyState>
      ) : (
        <ul className="m-0 list-none p-0">
          {allBets.map((bet, i) => {
            const match = matchMap.get(bet.matchId);
            return (
              <li
                key={i}
                className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
              >
                <div>
                  <span className="text-sm font-semibold text-text">
                    {bet.displayName || bet.username}
                  </span>
                  {match && (
                    <div className="text-xs text-textMuted">
                      <Link to={`/match/${bet.matchId}`}>
                        {match.homeTeam} vs {match.awayTeam}
                      </Link>
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-primary">
                  {bet.homeScore} – {bet.awayScore}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
