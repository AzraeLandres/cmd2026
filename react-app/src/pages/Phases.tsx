import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_PHASES } from "@graphql/queries";
import PhaseCard from "@molecules/PhaseCard";
import EmptyState from "@atoms/EmptyState";
import { INPUT } from "@utils/ui";
import { PHASE_ORDER, PHASE_LABELS } from "@utils/phases";

export default function Phases() {
  const [query, setQuery] = useState("");

  const { data, loading, error } = useQuery<{ phases: string[] }>(GET_PHASES);

  if (error)
    return (
      <EmptyState role="alert">Impossible de charger les phases.</EmptyState>
    );
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const phases = [...(data?.phases ?? [])].sort(
    (a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b),
  );

  const filtered = phases.filter((code) =>
    (PHASE_LABELS[code] ?? code).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <input
        className={`${INPUT} mb-3.5 w-full`}
        type="search"
        placeholder="Rechercher une phase…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher une phase de compétition"
      />
      {filtered.length === 0 ? (
        <EmptyState>Aucune phase trouvée.</EmptyState>
      ) : (
        filtered.map((code) => (
          <PhaseCard
            key={code}
            code={code}
            label={PHASE_LABELS[code] ?? code}
          />
        ))
      )}
    </>
  );
}
