import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useHeader } from "../App";
import { useProfile } from "../ProfileContext";
import { useAuth } from "../AuthContext";
import { GET_MATCHES, GET_ALL_BETS } from "../graphql/queries";
import MatchCard from "../molecules/MatchCard";
import EmptyState from "../atoms/EmptyState";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number;
  date: string;
  stage: string;
}

interface Bet {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

function pickFeaturedMatch(matches: Match[]): Match | null {
  return (
    matches.find((m) => m.status === "LIVE") ??
    matches.find((m) => m.status === "SCHEDULED") ??
    matches[0] ??
    null
  );
}

function pickTeamMatch(matches: Match[], team: string): Match | null {
  return (
    matches.find(
      (m) =>
        (m.homeTeam === team || m.awayTeam === team) && m.status === "LIVE",
    ) ??
    matches.find(
      (m) =>
        (m.homeTeam === team || m.awayTeam === team) &&
        m.status === "SCHEDULED",
    ) ??
    null
  );
}

export default function Home() {
  const setHeader = useHeader();
  const { favorites } = useProfile();
  const { user } = useAuth();

  useEffect(() => {
    setHeader({
      title: "Coupe du Monde 2026",
      showBack: false,
      liveMinute: null,
    });
  }, [setHeader]);

  const {
    data: matchData,
    loading: matchLoading,
    error: matchError,
  } = useQuery<{ matches: Match[] }>(GET_MATCHES);
  const { data: betsData } = useQuery<{ allBets: Bet[] }>(GET_ALL_BETS, {
    skip: !user,
  });

  if (matchError)
    return (
      <EmptyState role="alert">Impossible de charger les matchs.</EmptyState>
    );
  if (matchLoading) return <EmptyState>Chargement…</EmptyState>;

  const matches = matchData?.matches ?? [];
  const myBets = betsData?.allBets ?? [];
  const myBetIds = new Set(myBets.map((b) => b.matchId));
  const featured = pickFeaturedMatch(matches);

  const upcomingBets = myBets
    .map((bet) => {
      const match = matches.find((m) => m.id === bet.matchId);
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

  return (
    <>
      <section className="home-section" aria-label="Match du moment">
        <h2 className="section-title">Le match du moment</h2>
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
            className="home-section"
            key={team}
            aria-label={`Prochain match de ${team}`}
          >
            <h2 className="section-title">{team} — prochain match</h2>
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
        <Link to="/profil" className="card cta-card">
          Choisissez vos équipes favorites dans votre profil.
        </Link>
      )}

      {upcomingBets.length > 0 && (
        <section className="home-section" aria-label="Mes paris à venir">
          <h2 className="section-title">🎯 Mes paris à venir</h2>
          {upcomingBets.map(({ matchId, homeScore, awayScore, match: m }) => (
            <Link
              key={matchId}
              to={`/match/${matchId}`}
              className="card home-bet-card"
            >
              <div className="home-bet-teams">
                <span>{m.homeTeam}</span>
                <span className="home-bet-score">
                  {homeScore} – {awayScore}
                </span>
                <span>{m.awayTeam}</span>
              </div>
              <div className="muted" style={{ fontSize: "0.82rem" }}>
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
        <section className="home-section" aria-label="Matchs sans pari">
          <h2 className="section-title">⏳ À parier</h2>
          {upcomingUnbetted.map((m) => (
            <Link
              key={m.id}
              to={`/match/${m.id}`}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                {m.homeTeam} vs {m.awayTeam}
              </span>
              <span
                style={{
                  color: "var(--primary)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                Parier →
              </span>
            </Link>
          ))}
          <Link to="/paris" className="phases-link" style={{ marginTop: 4 }}>
            Voir le classement ›
          </Link>
        </section>
      )}

      <Link to="/phases" className="card phases-link">
        Voir toutes les phases de la compétition ›
      </Link>
    </>
  );
}
