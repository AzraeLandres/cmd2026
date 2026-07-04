interface Match {
  homeTeam:  string;
  awayTeam:  string;
  homeScore: number;
  awayScore: number;
  status:    string;
  minute:    number;
  date?:     string;
  venue?:    string;
}

function formatMatchDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      weekday: 'long',
      day:     '2-digit',
      month:   'long',
      hour:    '2-digit',
      minute:  '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function ScoreBlock({ match }: { match: Match }) {
  const isLive     = match.status === 'LIVE' || match.status === 'SUSPENDED';
  const isFinished = match.status === 'FINISHED';

  return (
    <>
      <div
        className="mb-2 rounded border border-border bg-surface p-4 text-center shadow-app"
        role="region"
        aria-label={`Score : ${match.homeTeam} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam}`}
      >
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 truncate text-sm font-semibold text-text">
            {match.homeTeam}
          </div>
          <div
            className="shrink-0 text-2xl font-bold text-text"
            aria-live={isLive ? 'polite' : undefined}
            aria-atomic="true"
          >
            {match.homeScore} - {match.awayScore}
          </div>
          <div className="flex-1 truncate text-sm font-semibold text-text">
            {match.awayTeam}
          </div>
        </div>

        {isLive && (
          <div
            className="mt-2 text-xs font-semibold text-live"
            aria-live="polite"
            aria-atomic="true"
          >
            {match.minute}' — en direct
          </div>
        )}
        {isFinished && (
          <div className="mt-2 text-xs text-textMuted">Match terminé</div>
        )}
      </div>

      <div className="space-y-0.5 text-center text-xs text-textMuted">
        {match.venue && <div>{match.venue}</div>}
        {match.date && <div>{formatMatchDate(match.date)}</div>}
      </div>
    </>
  );
}
