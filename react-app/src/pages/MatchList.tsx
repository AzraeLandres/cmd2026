import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_MATCHES } from "@graphql/queries";
import MatchCard from "@molecules/MatchCard";
import Chip from "@atoms/Chip";
import EmptyState from "@atoms/EmptyState";

const FILTERS: [string, string][] = [
  ["ALL", "Toutes"],
  ["LIVE", "Live"],
  ["SCHEDULED", "À venir"],
  ["FINISHED", "Terminés"],
];

export default function MatchList() {
  const { phase } = useParams<{ phase: string }>();
  const [active, setActive] = useState("ALL");

  useEffect(() => {
    setActive("ALL");
  }, [phase]);

  const { data, loading, error } = useQuery(GET_MATCHES, {
    variables: { phase },
  });
  const matches = data?.matches ?? [];
  const visible =
    active === "ALL"
      ? matches
      : matches.filter((m: { status: string }) => m.status === active);

  if (error)
    return (
      <EmptyState role="alert">Impossible de charger les matchs.</EmptyState>
    );
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  return (
    <>
      <div
        role="tablist"
        aria-label="Filtrer les matchs"
        className="mb-3.5 flex flex-wrap gap-2"
      >
        {FILTERS.map(([value, label]) => (
          <Chip
            key={value}
            active={active === value}
            onClick={() => setActive(value)}
            role="tab"
            aria-selected={active === value}
          >
            {label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          Aucun match {active !== "ALL" ? "dans cette catégorie" : ""}.
        </EmptyState>
      ) : (
        visible.map((m: any) => <MatchCard key={m.id} match={m} />)
      )}
    </>
  );
}
