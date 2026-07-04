import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useHeader } from "../App";
import { useProfile } from "../ProfileContext";
import { GET_MATCHES } from "../graphql/queries";
import MatchCard from "../molecules/MatchCard";
import EmptyState from "../atoms/EmptyState";

export default function Favorites() {
  const setHeader = useHeader();
  const { favorites } = useProfile();

  useEffect(() => {
    setHeader({ title: "Favoris", showBack: false, liveMinute: null });
  }, [setHeader]);

  const { data, loading, error } = useQuery(GET_MATCHES, {
    skip: favorites.length === 0,
  });

  if (favorites.length === 0) {
    return (
      <EmptyState>
        Vous n'avez pas encore choisi d'équipe favorite.{" "}
        <Link to="/profil">Allez dans votre profil</Link> pour en sélectionner
        une.
      </EmptyState>
    );
  }

  if (error)
    return (
      <EmptyState role="alert">Impossible de charger les matchs.</EmptyState>
    );
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const matches = data?.matches ?? [];

  return (
    <>
      {favorites.map((team) => {
        const teamMatches = matches.filter(
          (m: { homeTeam: string; awayTeam: string }) =>
            m.homeTeam === team || m.awayTeam === team,
        );
        return (
          <section
            key={team}
            className="home-section"
            aria-label={`Matchs de ${team}`}
          >
            <h2 className="section-title">{team}</h2>
            {teamMatches.length === 0 ? (
              <EmptyState>Aucun match pour {team}.</EmptyState>
            ) : (
              teamMatches.map((m: any) => <MatchCard key={m.id} match={m} />)
            )}
          </section>
        );
      })}
    </>
  );
}
