import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@context/AuthContext";
import { GET_BETS } from "@graphql/queries";
import { PLACE_BET } from "@graphql/mutations";

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
    <section className="bet-section" aria-label="Paris des amis">
      <h2>🎯 Paris des amis</h2>

      {matchStatus !== "FINISHED" && user && (
        <form
          className="bet-form"
          onSubmit={handleSubmit}
          aria-label="Placer mon pari"
        >
          {match && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginRight: 6,
              }}
            >
              {match.homeTeam}
            </span>
          )}
          <input
            className="bet-score-input"
            type="number"
            min="0"
            max="20"
            value={homeInput}
            onChange={(e) => setHomeInput(e.target.value)}
            aria-label={`Score de ${match?.homeTeam ?? "l'équipe domicile"}`}
            placeholder="0"
          />
          <span className="bet-separator">–</span>
          <input
            className="bet-score-input"
            type="number"
            min="0"
            max="20"
            value={awayInput}
            onChange={(e) => setAwayInput(e.target.value)}
            aria-label={`Score de ${match?.awayTeam ?? "l'équipe extérieure"}`}
            placeholder="0"
          />
          {match && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginLeft: 6,
              }}
            >
              {match.awayTeam}
            </span>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={placing}
            style={{ marginTop: 0, padding: "8px 16px", fontSize: "0.88rem" }}
            aria-busy={placing}
          >
            {placing ? "…" : "Parier"}
          </button>
        </form>
      )}

      {!user && matchStatus !== "FINISHED" && (
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Connectez-vous pour parier.
        </p>
      )}

      {formError && (
        <div className="form-error" role="alert">
          {formError}
        </div>
      )}
      {saved && (
        <div className="form-success" role="status">
          Pari enregistré !
        </div>
      )}

      {bets.length === 0 ? (
        <div
          className="muted"
          style={{ fontSize: "0.88rem", paddingBottom: 8 }}
        >
          Aucun pari pour ce match. Soyez le premier !
        </div>
      ) : (
        <ul className="bet-list" aria-label="Paris des participants">
          {bets.map((bet, i) => {
            const result = match ? evaluateBet(bet, match) : null;
            return (
              <li className="bet-item" key={i}>
                <span className="bet-user">
                  {bet.displayName || bet.username}
                </span>
                <span
                  className={
                    "bet-score" + (result === "exact" ? " bet-correct" : "")
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
