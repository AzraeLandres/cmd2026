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
import Bet from "@interfaces/Bet.ts";
import Match from "@interfaces/Match.ts";
import { scoreBetOutcome, pointsForOutcome } from "@utils/betScoring";

function computePoints(bet: Bet, match: Match): number | null {
  if (match.status !== "FINISHED") return null;
  return pointsForOutcome(
    scoreBetOutcome(bet.homeScore, bet.awayScore, match.homeScore, match.awayScore),
  );
}

export default function Bets() {
  const { data: matchData, loading: matchLoading } = useQuery<{
    matches: Match[];
  }>(GET_MATCHES, { fetchPolicy: "cache-and-network" });
  const { data: betsData, loading: betsLoading } = useQuery<{
    allBets: Bet[];
  }>(GET_ALL_BETS, { fetchPolicy: "cache-and-network" });

  const loading = matchLoading || betsLoading;
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const matches = matchData?.matches ?? [];
  const allBets = betsData?.allBets ?? [];

  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const betsByMatch = [...allBets].sort((a, b) => {
    const dateA = matchMap.get(a.matchId)?.date;
    const dateB = matchMap.get(b.matchId)?.date;
    const timeA = dateA ? new Date(dateA).getTime() : 0;
    const timeB = dateB ? new Date(dateB).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.matchId.localeCompare(b.matchId);
  });

  const betGroups = betsByMatch.reduce<
    { matchId: string; match?: Match; bets: Bet[] }[]
  >((groups, bet) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.matchId === bet.matchId) {
      lastGroup.bets.push(bet);
    } else {
      groups.push({
        matchId: bet.matchId,
        match: matchMap.get(bet.matchId),
        bets: [bet],
      });
    }
    return groups;
  }, []);

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
        <div className="space-y-4">
          {betGroups.map((group) => (
            <div key={group.matchId}>
              <Link
                to={`/match/${group.matchId}`}
                className="mb-1 block text-sm font-semibold text-text hover:text-primary"
              >
                {group.match
                  ? `${group.match.homeTeam} vs ${group.match.awayTeam}`
                  : `Match ${group.matchId}`}
              </Link>
              <ul className="m-0 list-none p-0">
                {group.bets.map((bet, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                  >
                    <span className="text-sm text-text">
                      {bet.displayName || bet.username}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {bet.homeScore} – {bet.awayScore}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
