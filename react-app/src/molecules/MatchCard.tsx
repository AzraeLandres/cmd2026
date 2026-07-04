import { Link } from "react-router-dom";
import StatusPill from "@atoms/StatusPill";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number;
  date?: string;
}

function formatScheduled(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function midLabel(match: Match): string {
  if (match.status === "LIVE" || match.status === "SUSPENDED") {
    return `${match.homeScore} - ${match.awayScore} (${match.minute}')`;
  }
  if (match.status === "FINISHED") {
    return `${match.homeScore} - ${match.awayScore}`;
  }
  return match.date ? formatScheduled(match.date) : "";
}

export default function MatchCard({ match }: { match: Match }) {
  const label = midLabel(match);
  return (
    <Link
      to={`/match/${match.id}`}
      className="card match-card"
      aria-label={`${match.homeTeam} contre ${match.awayTeam}, ${label}`}
    >
      <div className="match-row">
        <span className="team-name">{match.homeTeam}</span>
        <StatusPill status={match.status} />
      </div>
      <div className="match-row">
        <span className="team-name">{match.awayTeam}</span>
        <span className="match-mid">{label}</span>
      </div>
    </Link>
  );
}
