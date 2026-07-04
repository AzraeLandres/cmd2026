import Match from "@interfaces/Match.ts";

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
