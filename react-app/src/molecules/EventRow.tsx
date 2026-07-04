interface MatchEvent {
  minute:  number;
  type:    string;
  team:    string;
  player?: string | null;
  assist?: string | null;
  penalty?: boolean;
  ownGoal?: boolean;
}

function eventIcon(ev: MatchEvent): string {
  if (ev.type === 'GOAL')     return '⚽';
  if (ev.type === 'RED_CARD') return '🟥';
  return '🟨';
}

function eventLabel(ev: MatchEvent): string {
  if (ev.type === 'GOAL') {
    const scorer = ev.player ?? 'Buteur non précisé';
    const suffix = ev.ownGoal ? ' (but contre son camp)' : ev.penalty ? ' (sur penalty)' : '';
    return `${scorer} — ${ev.team}${suffix}`;
  }
  const cardLabel = ev.type === 'RED_CARD' ? 'Carton rouge' : 'Carton jaune';
  return `${ev.player ?? 'Joueur non précisé'} — ${ev.team} (${cardLabel})`;
}

export default function EventRow({ event: ev }: { event: MatchEvent }) {
  const isCard = ev.type !== 'GOAL';
  return (
    <div
      className="flex items-center gap-2 border-b border-border py-1.5 last:border-0"
      role="listitem"
      aria-label={`${ev.minute}e minute — ${eventLabel(ev)}`}
    >
      <span
        className={
          'w-8 shrink-0 text-xs font-semibold ' +
          (isCard ? 'text-live' : 'text-textMuted')
        }
      >
        {ev.minute}'
      </span>
      <span className="shrink-0 text-base" aria-hidden="true">
        {eventIcon(ev)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-text">{eventLabel(ev)}</div>
        {ev.type === 'GOAL' && ev.assist && (
          <div className="text-xs text-textMuted">
            Passe décisive : {ev.assist}
          </div>
        )}
      </div>
    </div>
  );
}
