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
      className="event-row"
      role="listitem"
      aria-label={`${ev.minute}e minute — ${eventLabel(ev)}`}
    >
      <span className={'event-minute' + (isCard ? ' card' : '')}>{ev.minute}'</span>
      <span className="event-icon" aria-hidden="true">{eventIcon(ev)}</span>
      <div className="event-main">
        <div className="event-title">{eventLabel(ev)}</div>
        {ev.type === 'GOAL' && ev.assist && (
          <div className="event-assist">Passe décisive : {ev.assist}</div>
        )}
      </div>
    </div>
  );
}
