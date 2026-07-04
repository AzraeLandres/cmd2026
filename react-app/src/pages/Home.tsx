import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useProfile } from "@context/ProfileContext";
import { useAuth } from "@context/AuthContext";
import { GET_MATCHES, GET_ALL_BETS } from "@graphql/queries";
import MatchCard from "@molecules/MatchCard";
import EmptyState from "@atoms/EmptyState";
import Match from "@interfaces/Match.ts";
import Bet from "@interfaces/Bet.ts";
import { pickFeaturedMatch, pickTeamMatch } from "@/utils/matchHelpers";
import { CARD } from "@utils/ui";

export default function Home() {
  const { favorites } = useProfile();
  const { user } = useAuth();

  const {
    data: matchData,
    loading: matchLoading,
    error: matchError,
  } = useQuery<{ matches: Match[] }>(GET_MATCHES);
  const { data: betsData } = useQuery<{ allBets: Bet[] }>(GET_ALL_BETS, {
    skip: !user,
  });

  const matches = matchData?.matches ?? [];
  const myBets = betsData?.allBets ?? [];

  const { featured, upcomingBets, upcomingUnbetted } = useMemo(() => {
    const matchById = new Map(matches.map((m) => [m.id, m]));
    const myBetIds = new Set(myBets.map((b) => b.matchId));

    const upcomingBets = myBets
      .map((bet) => {
        const match = matchById.get(bet.matchId);
        return match ? { ...bet, match } : null;
      })
      .filter(
        (b): b is Bet & { match: Match } =>
          b !== null && b.match.status === "SCHEDULED",
      )
      .slice(0, 5);

    const upcomingUnbetted = matches
      .filter((m) => m.status === "SCHEDULED" && !myBetIds.has(m.id))
      .slice(0, 3);

    return {
      featured: pickFeaturedMatch(matches),
      upcomingBets,
      upcomingUnbetted,
    };
  }, [matches, myBets]);

  if (matchError)
    return (
      <EmptyState role="alert">Impossible de charger les matchs.</EmptyState>
    );
  if (matchLoading) return <EmptyState>Chargement…</EmptyState>;

  return (
    <>
      <section className="mb-6" aria-label="Match du moment">
        <h2 className="mb-2 text-sm text-text">Le match du moment</h2>
        {featured ? (
          <MatchCard match={featured} />
        ) : (
          <EmptyState>Aucun match à afficher.</EmptyState>
        )}
      </section>

      {favorites.map((team) => {
        const teamMatch = pickTeamMatch(matches, team);
        const isSameFeatured =
          featured && teamMatch && teamMatch.id === featured.id;
        return (
          <section
            className="mb-6"
            key={team}
            aria-label={`Prochain match de ${team}`}
          >
            <h2 className="mb-2 text-sm text-text">
              {team} — prochain match
            </h2>
            {!teamMatch && (
              <EmptyState>Aucun match trouvé pour {team}.</EmptyState>
            )}
            {teamMatch && isSameFeatured && (
              <EmptyState>C'est le match affiché ci-dessus.</EmptyState>
            )}
            {teamMatch && !isSameFeatured && <MatchCard match={teamMatch} />}
          </section>
        );
      })}

      {favorites.length === 0 && (
        <Link
          to="/profil"
          className={`${CARD} border-dashed border-primary bg-primary/5 text-sm font-semibold text-primary`}
        >
          Choisissez vos équipes favorites dans votre profil.
        </Link>
      )}

      {upcomingBets.length > 0 && (
        <section className="mb-6" aria-label="Mes paris à venir">
          <h2 className="mb-2 text-sm text-text">🎯 Mes paris à venir</h2>
          {upcomingBets.map(({ matchId, homeScore, awayScore, match: m }) => (
            <Link
              key={matchId}
              to={`/match/${matchId}`}
              className={`${CARD} flex items-center justify-between`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>{m.homeTeam}</span>
                <span className="font-bold text-primary">
                  {homeScore} – {awayScore}
                </span>
                <span>{m.awayTeam}</span>
              </div>
              <div className="text-xs text-textMuted">
                {new Date(m.date).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            </Link>
          ))}
        </section>
      )}

      {upcomingUnbetted.length > 0 && (
        <section className="mb-6" aria-label="Matchs sans pari">
          <h2 className="mb-2 text-sm text-text">⏳ À parier</h2>
          {upcomingUnbetted.map((m) => (
            <Link
              key={m.id}
              to={`/match/${m.id}`}
              className={`${CARD} flex items-center justify-between`}
            >
              <span className="text-sm font-semibold">
                {m.homeTeam} vs {m.awayTeam}
              </span>
              <span className="text-xs font-semibold text-primary">
                Parier →
              </span>
            </Link>
          ))}
          <Link
            to="/paris"
            className="mt-1 block text-center font-semibold text-primary"
          >
            Voir le classement ›
          </Link>
        </section>
      )}

      <Link
        to="/phases"
        className={`${CARD} text-center font-semibold text-primary`}
      >
        Voir toutes les phases de la compétition ›
      </Link>
    </>
  );
}
