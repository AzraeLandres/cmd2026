import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useHeader } from "@context/HeaderContext";
import { GET_ALL_BETS, GET_MATCHES } from "@graphql/queries";
import EmptyState from "@atoms/EmptyState";

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
  const setHeader = useHeader();

  useEffect(() => {
    setHeader({ title: "Paris", showBack: false, liveMinute: null });
  }, [setHeader]);

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
      <h2 className="section-title">Classement</h2>
      {sorted.length === 0 ? (
        <EmptyState>Aucun pari enregistré.</EmptyState>
      ) : (
        <table className="data-table" aria-label="Classement des paris">
          <thead>
            <tr>
              <th>#</th>
              <th>Joueur</th>
              <th className="num">Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([username, { displayName, points }], index) => (
              <tr key={username}>
                <td>{index + 1}</td>
                <td>{displayName || username}</td>
                <td className="num">{points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="section-title" style={{ marginTop: 24 }}>
        Tous les paris
      </h2>
      {allBets.length === 0 ? (
        <EmptyState>Aucun pari pour l'instant.</EmptyState>
      ) : (
        <ul className="bet-list">
          {allBets.map((bet, i) => {
            const match = matchMap.get(bet.matchId);
            return (
              <li key={i} className="bet-item">
                <div>
                  <span className="bet-user">
                    {bet.displayName || bet.username}
                  </span>
                  {match && (
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      <Link to={`/match/${bet.matchId}`}>
                        {match.homeTeam} vs {match.awayTeam}
                      </Link>
                    </div>
                  )}
                </div>
                <span className="bet-score">
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
