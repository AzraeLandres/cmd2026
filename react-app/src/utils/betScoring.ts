export type BetOutcome = "exact" | "close" | "winner" | "wrong";

// "close" = bon vainqueur pronostiqué, score différent mais à 1 but près (somme des écarts).
export function scoreBetOutcome(
  betHome: number,
  betAway: number,
  realHome: number,
  realAway: number,
): BetOutcome {
  if (betHome === realHome && betAway === realAway) return "exact";

  const rightWinner =
    Math.sign(betHome - betAway) === Math.sign(realHome - realAway);
  if (!rightWinner) return "wrong";

  const distance = Math.abs(betHome - realHome) + Math.abs(betAway - realAway);
  return distance <= 1 ? "close" : "winner";
}

const POINTS_BY_OUTCOME: Record<BetOutcome, number> = {
  exact: 3,
  close: 2,
  winner: 1,
  wrong: 0,
};

export function pointsForOutcome(outcome: BetOutcome): number {
  return POINTS_BY_OUTCOME[outcome];
}
