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
        className="score-block"
        role="region"
        aria-label={`Score : ${match.homeTeam} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam}`}
      >
        <div className="score-teams">
          <div className="score-team-col">{match.homeTeam}</div>
          <div
            className="score-value"
            aria-live={isLive ? 'polite' : undefined}
            aria-atomic="true"
          >
            {match.homeScore} - {match.awayScore}
          </div>
          <div className="score-team-col">{match.awayTeam}</div>
        </div>

        {isLive && (
          <div className="live-minute" aria-live="polite" aria-atomic="true">
            {match.minute}' — en direct
          </div>
        )}
        {isFinished && <div className="live-minute muted">Match terminé</div>}
      </div>

      <div className="info-block">
        {match.venue && <div>{match.venue}</div>}
        {match.date  && <div className="muted">{formatMatchDate(match.date)}</div>}
      </div>
    </>
  );
}
