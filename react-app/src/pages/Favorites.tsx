import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useProfile } from "@context/ProfileContext";
import { GET_MATCHES } from "@graphql/queries";
import MatchCard from "@molecules/MatchCard";
import EmptyState from "@atoms/EmptyState";
import SectionTitle from "@atoms/SectionTitle";
import { SECTION } from "@utils/ui";

export default function Favorites() {
  const { favorites } = useProfile();

  const { data, loading, error } = useQuery(GET_MATCHES, {
    skip: favorites.length === 0,
    fetchPolicy: "cache-and-network",
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
          <section key={team} className={SECTION} aria-label={`Matchs de ${team}`}>
            <SectionTitle>{team}</SectionTitle>
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
