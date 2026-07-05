import Match from "@interfaces/Match.ts";

const UNASSIGNED_TEAM_LABELS = new Set(["", "À déterminer", "TBD"]);

export function hasAssignedTeams(match: Match): boolean {
  return (
    !UNASSIGNED_TEAM_LABELS.has(match.homeTeam.trim()) &&
    !UNASSIGNED_TEAM_LABELS.has(match.awayTeam.trim())
  );
}

export function pickFeaturedMatch(matches: Match[]): Match | null {
  return (
    matches.find((m) => m.status === "LIVE") ??
    matches.find((m) => m.status === "SCHEDULED") ??
    matches[0] ??
    null
  );
}

export function pickTeamMatch(matches: Match[], team: string): Match | null {
  return (
    matches.find(
      (m) =>
        (m.homeTeam === team || m.awayTeam === team) && m.status === "LIVE",
    ) ??
    matches.find(
      (m) =>
        (m.homeTeam === team || m.awayTeam === team) &&
        m.status === "SCHEDULED",
    ) ??
    null
  );
}
