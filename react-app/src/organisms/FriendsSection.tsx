import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_FRIENDS } from "@graphql/queries";
import {
  SEND_FRIEND_REQUEST,
  ACCEPT_FRIEND_REQUEST,
  REMOVE_FRIEND,
} from "@graphql/mutations";
import { SECTION, INPUT, FORM_ERROR, FORM_SUCCESS } from "@utils/ui";
import SectionTitle from "@atoms/SectionTitle";

interface FriendEntry {
  id: number;
  username: string;
  displayName: string;
  status: string;
  direction: "incoming" | "outgoing";
}

const FRIENDS_POLL_INTERVAL_MS = 15_000;

export default function FriendsSection() {
  const [query, setQuery] = useState("");
  const [addStatus, setAddStatus] = useState<Record<string, string>>({});

  const { data, refetch } = useQuery<{ friends: FriendEntry[] }>(GET_FRIENDS, {
    pollInterval: FRIENDS_POLL_INTERVAL_MS,
  });
  const friends = data?.friends ?? [];
  const acceptedFriends = friends.filter((f) => f.status === "accepted");
  const pendingReceived = friends.filter(
    (f) => f.status === "pending" && f.direction === "incoming",
  );
  const pendingSent = friends.filter(
    (f) => f.status === "pending" && f.direction === "outgoing",
  );

  const [sendRequest, { loading: sendingRequest }] =
    useMutation(SEND_FRIEND_REQUEST);
  const [acceptRequest] = useMutation(ACCEPT_FRIEND_REQUEST);
  const [removeFriend, { loading: removing }] = useMutation(REMOVE_FRIEND);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    try {
      await sendRequest({ variables: { username: trimmed } });
      setAddStatus((prev) => ({ ...prev, [trimmed]: "sent" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setAddStatus((prev) => ({ ...prev, [trimmed]: msg }));
    }
  }

  async function handleAccept(friendId: number) {
    await acceptRequest({ variables: { friendId } });
    refetch();
  }

  async function handleRemove(friendId: number) {
    await removeFriend({ variables: { friendId } });
    refetch();
  }

  return (
    <section className={SECTION} aria-label="Amis">
      <SectionTitle>Amis</SectionTitle>

      <form
        className="mb-3 flex gap-2"
        onSubmit={handleSearch}
        role="search"
        aria-label="Ajouter un ami par pseudo"
      >
        <input
          className={`${INPUT} flex-1`}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAddStatus({});
          }}
          placeholder="Pseudo exact de l'ami"
          minLength={2}
          aria-label="Pseudo à ajouter"
        />
        <button
          type="submit"
          className="shrink-0 rounded bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={sendingRequest || query.trim().length < 2}
          aria-busy={sendingRequest}
          aria-label="Envoyer la demande"
        >
          {sendingRequest ? "…" : "+ Ajouter"}
        </button>
      </form>

      {addStatus[query.trim()] && (
        <p
          className={
            addStatus[query.trim()] === "sent" ? FORM_SUCCESS : FORM_ERROR
          }
          role="status"
        >
          {addStatus[query.trim()] === "sent"
            ? "Demande envoyée !"
            : addStatus[query.trim()]}
        </p>
      )}

      {pendingReceived.length > 0 && (
        <div role="status" aria-live="polite">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Demandes reçues
          </div>
          <ul className="m-0 mb-3 list-none p-0">
            {pendingReceived.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text">
                    {u.displayName || u.username}
                  </span>
                  <span className="text-xs text-textMuted">@{u.username}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-white"
                    onClick={() => handleAccept(u.id)}
                    aria-label={`Accepter ${u.username}`}
                  >
                    Accepter
                  </button>
                  <button
                    className="rounded border border-border px-2 py-1 text-sm text-textMuted hover:text-live"
                    onClick={() => handleRemove(u.id)}
                    aria-label={`Refuser ${u.username}`}
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingSent.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Demandes envoyées
          </div>
          <ul className="m-0 mb-3 list-none p-0">
            {pendingSent.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text">
                    {u.displayName || u.username}
                  </span>
                  <span className="text-xs text-textMuted">@{u.username}</span>
                </div>
                <span className="text-xs text-textMuted">En attente…</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {acceptedFriends.length > 0 && (
        <ul className="m-0 list-none p-0" aria-label="Mes amis">
          {acceptedFriends.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text">
                  {u.displayName || u.username}
                </span>
                <span className="text-xs text-textMuted">@{u.username}</span>
              </div>
              <button
                className="rounded border border-border px-2 py-1 text-sm text-textMuted hover:text-live disabled:opacity-50"
                disabled={removing}
                onClick={() => handleRemove(u.id)}
                aria-label={`Supprimer ${u.username}`}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      {acceptedFriends.length === 0 &&
        pendingReceived.length === 0 &&
        pendingSent.length === 0 && (
        <p className="my-1.5 text-sm text-textMuted">
          Aucun ami pour l'instant.
        </p>
      )}
    </section>
  );
}
