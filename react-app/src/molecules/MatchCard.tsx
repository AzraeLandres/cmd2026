import { Link } from "react-router-dom";
import StatusPill from "@atoms/StatusPill";
import { CARD } from "@utils/ui";

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
      className={CARD}
      aria-label={`${match.homeTeam} contre ${match.awayTeam}, ${label}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{match.homeTeam}</span>
        <StatusPill status={match.status} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{match.awayTeam}</span>
        <span className="text-xs text-textMuted">{label}</span>
      </div>
    </Link>
  );
}
