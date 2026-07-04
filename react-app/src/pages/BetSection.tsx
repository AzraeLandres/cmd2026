import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@context/AuthContext";
import { GET_BETS } from "@graphql/queries";
import { PLACE_BET } from "@graphql/mutations";
import { SECTION, FORM_ERROR, FORM_SUCCESS } from "@utils/ui";
import SectionTitle from "@atoms/SectionTitle";

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

interface BetEntry {
  matchId: string;
  homeScore: number;
  awayScore: number;
  userId: number;
  username: string;
  displayName: string;
}

interface Props {
  matchId: string;
  matchStatus: string;
  match: Match | null;
}

type BetResult = "exact" | "winner" | "wrong" | null;

function evaluateBet(bet: BetEntry, match: Match): BetResult {
  if (match.status !== "FINISHED") return null;
  const exactScore =
    bet.homeScore === match.homeScore && bet.awayScore === match.awayScore;
  const rightWinner =
    Math.sign(bet.homeScore - bet.awayScore) ===
    Math.sign(match.homeScore - match.awayScore);
  if (exactScore) return "exact";
  if (rightWinner) return "winner";
  return "wrong";
}

export default function BetSection({ matchId, matchStatus, match }: Props) {
  const { user } = useAuth();
  const [homeInput, setHomeInput] = useState("");
  const [awayInput, setAwayInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pollInterval = matchStatus === "FINISHED" ? 0 : 5_000;

  const { data, refetch } = useQuery<{ bets: BetEntry[] }>(GET_BETS, {
    variables: { matchId },
    pollInterval,
    onCompleted(d) {
      if (!user) return;
      const mine = d.bets.find((b) => b.username === user.username);
      if (mine) {
        setHomeInput(String(mine.homeScore));
        setAwayInput(String(mine.awayScore));
      }
    },
  });

  const [placeBet, { loading: placing }] = useMutation(PLACE_BET);

  const bets = data?.bets ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const homeScore = parseInt(homeInput, 10);
    const awayScore = parseInt(awayInput, 10);
    if (
      isNaN(homeScore) ||
      isNaN(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      setFormError("Entrez un score valide.");
      return;
    }
    try {
      await placeBet({ variables: { matchId, homeScore, awayScore } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await refetch();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    }
  }

  return (
    <section className={SECTION} aria-label="Paris des amis">
      <SectionTitle>Paris des amis</SectionTitle>

      {matchStatus !== "FINISHED" && user && (
        <form
          className="mb-3 flex flex-wrap items-center gap-2"
          onSubmit={handleSubmit}
          aria-label="Placer mon pari"
        >
          {match && (
            <span className="mr-1.5 text-sm text-textMuted">
              {match.homeTeam}
            </span>
          )}
          <input
            className="w-14 rounded border border-border bg-surface px-1.5 py-2 text-center text-lg font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
            type="number"
            min="0"
            max="20"
            value={homeInput}
            onChange={(e) => setHomeInput(e.target.value)}
            aria-label={`Score de ${match?.homeTeam ?? "l'équipe domicile"}`}
            placeholder="0"
          />
          <span className="text-lg font-bold text-textMuted">–</span>
          <input
            className="w-14 rounded border border-border bg-surface px-1.5 py-2 text-center text-lg font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
            type="number"
            min="0"
            max="20"
            value={awayInput}
            onChange={(e) => setAwayInput(e.target.value)}
            aria-label={`Score de ${match?.awayTeam ?? "l'équipe extérieure"}`}
            placeholder="0"
          />
          {match && (
            <span className="ml-1.5 text-sm text-textMuted">
              {match.awayTeam}
            </span>
          )}
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            disabled={placing}
            aria-busy={placing}
          >
            {placing ? "…" : "Parier"}
          </button>
        </form>
      )}

      {!user && matchStatus !== "FINISHED" && (
        <p className="text-sm text-textMuted">Connectez-vous pour parier.</p>
      )}

      {formError && (
        <div className={FORM_ERROR} role="alert">
          {formError}
        </div>
      )}
      {saved && (
        <div className={FORM_SUCCESS} role="status">
          Pari enregistré !
        </div>
      )}

      {bets.length === 0 ? (
        <div className="pb-2 text-sm text-textMuted">
          Aucun pari pour ce match. Soyez le premier !
        </div>
      ) : (
        <ul className="m-0 list-none p-0" aria-label="Paris des participants">
          {bets.map((bet, i) => {
            const result = match ? evaluateBet(bet, match) : null;
            return (
              <li
                className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                key={i}
              >
                <span className="text-sm font-semibold text-text">
                  {bet.displayName || bet.username}
                </span>
                <span
                  className={
                    "text-sm font-bold " +
                    (result === "exact" ? "text-secondary" : "text-primary")
                  }
                  aria-label={`Parie ${bet.homeScore} – ${bet.awayScore}`}
                >
                  {bet.homeScore} – {bet.awayScore}
                  {result === "exact" && " ✅"}
                  {result === "winner" && " 🟡"}
                  {result === "wrong" && " ❌"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
