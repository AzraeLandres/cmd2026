import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useProfile } from "@context/ProfileContext";
import { useAuth } from "@context/AuthContext";
import { GET_MATCHES } from "@graphql/queries";
import FriendsSection from "@organisms/FriendsSection";
import SectionTitle from "@atoms/SectionTitle";
import { INPUT } from "@utils/ui";

export default function Profile() {
  const { favorites, addFavorite, removeFavorite } = useProfile();
  const { user, logout, deleteAccount } = useAuth();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
    } finally {
      setDeleting(false);
    }
  }

  const { data } = useQuery(GET_MATCHES, { fetchPolicy: "cache-and-network" });
  const allTeams = useMemo(() => {
    const matches = data?.matches ?? [];
    const teamSet = new Set<string>();
    for (const m of matches) {
      if (m.homeTeam) teamSet.add(m.homeTeam);
      if (m.awayTeam) teamSet.add(m.awayTeam);
    }
    return Array.from(teamSet).sort();
  }, [data]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? allTeams.filter((t) => t.toLowerCase().includes(q)) : allTeams;
  }, [allTeams, search]);

  const initial = (user!.displayName || user!.username || "?")[0].toUpperCase();
  const displayLabel = user!.displayName || user!.username;

  return (
    <>
      <div className="mb-5 flex items-center gap-3.5 rounded bg-gradient-to-br from-primary to-secondary p-4 text-white">
        <div
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-white/25 text-2xl font-bold"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div>
          <div className="text-lg font-bold">{displayLabel}</div>
          <div className="text-sm opacity-80">@{user!.username}</div>
        </div>
      </div>

      <FriendsSection />

      <section aria-label="Équipes favorites">
        <div className="mb-2.5 flex items-center justify-between gap-2.5">
          <SectionTitle className="mb-0">Équipes favorites</SectionTitle>
          <input
            className={`${INPUT} w-[140px]`}
            type="search"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher une équipe"
          />
        </div>

        <div className="no-scrollbar max-h-80 overflow-y-auto pr-1">
          {favorites.length > 0 && (
            <ul className="m-0 mb-3 list-none p-0">
              {favorites.map((team) => (
                <li
                  key={team}
                  className="flex items-center justify-between border-b border-border py-2"
                >
                  <span className="text-sm font-semibold">{team}</span>
                  <button
                    onClick={() => removeFavorite(team)}
                    aria-label={`Retirer ${team} des favoris`}
                    className="border-none bg-transparent p-0 text-lg text-textMuted hover:text-live"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}

          {filteredTeams.length > 0 && (
            <ul className="m-0 list-none p-0">
              {filteredTeams
                .filter((t) => !favorites.includes(t))
                .map((team) => (
                  <li
                    key={team}
                    className="flex items-center justify-between border-b border-border py-1.5"
                  >
                    <span className="text-sm">{team}</span>
                    <button
                      onClick={() => addFavorite(team)}
                      aria-label={`Ajouter ${team} aux favoris`}
                      className="border-none bg-transparent p-0 text-base text-primary hover:text-primary/70"
                    >
                      ＋
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>

      <button
        className="mt-6 w-full rounded bg-live py-3 text-sm font-bold text-white hover:bg-live/90"
        onClick={logout}
      >
        Se déconnecter
      </button>

      {confirmDelete ? (
        <div className="mt-3 rounded border border-live/40 bg-live/5 p-3 text-center">
          <p className="mb-2 text-sm font-semibold text-live">
            Supprimer définitivement votre compte ? Cette action est
            irréversible.
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded border border-border py-2 text-sm font-semibold text-text"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Annuler
            </button>
            <button
              className="flex-1 rounded bg-live py-2 text-sm font-bold text-white disabled:opacity-50"
              onClick={handleDeleteAccount}
              disabled={deleting}
              aria-busy={deleting}
            >
              {deleting ? "…" : "Confirmer la suppression"}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="mt-3 w-full rounded border border-live py-3 text-sm font-bold text-live hover:bg-live/5"
          onClick={() => setConfirmDelete(true)}
        >
          Supprimer mon compte
        </button>
      )}
    </>
  );
}
