import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useHeader } from "@context/HeaderContext";
import { GET_MATCHES } from "@graphql/queries";
import MatchCard from "@molecules/MatchCard";
import Chip from "@atoms/Chip";
import EmptyState from "@atoms/EmptyState";

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Phase de groupes",
  LAST_32: "32e de finale",
  LAST_16: "8e de finale",
  QUARTER_FINALS: "Quarts de finale",
  SEMI_FINALS: "Demi-finales",
  THIRD_PLACE: "Match pour la 3e place",
  FINAL: "Finale",
};

const FILTERS: [string, string][] = [
  ["ALL", "Toutes"],
  ["LIVE", "Live"],
  ["SCHEDULED", "À venir"],
  ["FINISHED", "Terminés"],
];

export default function MatchList() {
  const { phase } = useParams<{ phase: string }>();
  const setHeader = useHeader();
  const [active, setActive] = useState("ALL");

  useEffect(() => {
    setHeader({
      title: PHASE_LABELS[phase ?? ""] ?? "Matchs",
      showBack: true,
      liveMinute: null,
    });
    setActive("ALL");
  }, [phase, setHeader]);

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
        style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
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
