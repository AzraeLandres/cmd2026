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
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");

  const { data } = useQuery(GET_MATCHES);
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
      </section>

      <button
        className="mt-6 w-full rounded bg-live py-3 text-sm font-bold text-white hover:bg-live/90"
        onClick={logout}
      >
        Se déconnecter
      </button>
    </>
  );
}
