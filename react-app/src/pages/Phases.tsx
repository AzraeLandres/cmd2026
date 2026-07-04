import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useHeader } from '../App';
import { GET_PHASES } from '../graphql/queries';
import PhaseCard  from '../molecules/PhaseCard';
import EmptyState from '../atoms/EmptyState';

const PHASE_ORDER = [
  'GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL',
];

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE:   'Phase de groupes',
  LAST_32:       '32e de finale',
  LAST_16:       '8e de finale',
  QUARTER_FINALS:'Quarts de finale',
  SEMI_FINALS:   'Demi-finales',
  THIRD_PLACE:   'Match pour la 3e place',
  FINAL:         'Finale',
};

export default function Phases() {
  const setHeader = useHeader();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setHeader({ title: 'Phases de la compétition', showBack: false, liveMinute: null });
  }, [setHeader]);

  const { data, loading, error } = useQuery<{ phases: string[] }>(GET_PHASES);

  if (error)   return <EmptyState role="alert">Impossible de charger les phases.</EmptyState>;
  if (loading) return <EmptyState>Chargement…</EmptyState>;

  const phases = [...(data?.phases ?? [])]
    .sort((a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b));

  const filtered = phases.filter((code) =>
    (PHASE_LABELS[code] ?? code).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <input
        className="search-box"
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
          <PhaseCard key={code} code={code} label={PHASE_LABELS[code] ?? code} />
        ))
      )}
    </>
  );
}
