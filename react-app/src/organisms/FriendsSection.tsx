import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_FRIENDS } from "@graphql/queries";
import {
  SEND_FRIEND_REQUEST,
  ACCEPT_FRIEND_REQUEST,
  REMOVE_FRIEND,
} from "@graphql/mutations";

interface FriendEntry {
  id: number;
  username: string;
  displayName: string;
  status: string;
}

export default function FriendsSection() {
  const [query, setQuery] = useState("");
  const [addStatus, setAddStatus] = useState<Record<string, string>>({});

  const { data, refetch } = useQuery<{ friends: FriendEntry[] }>(GET_FRIENDS);
  const friends = data?.friends ?? [];
  const acceptedFriends = friends.filter((f) => f.status === "accepted");
  const pendingReceived = friends.filter((f) => f.status === "pending");

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
    <section className="friends-section" aria-label="Amis">
      <h2 className="section-title">Amis</h2>

      <form
        className="friends-search-bar"
        onSubmit={handleSearch}
        role="search"
        aria-label="Ajouter un ami par pseudo"
      >
        <input
          className="friends-search-input"
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
          className="friends-search-btn"
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
            addStatus[query.trim()] === "sent" ? "form-success" : "form-error"
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
          <div className="friends-group-label">Demandes reçues</div>
          <ul className="friends-list">
            {pendingReceived.map((u) => (
              <li key={u.id} className="friend-row">
                <div className="friend-info">
                  <span className="friend-name">
                    {u.displayName || u.username}
                  </span>
                  <span className="friend-handle">@{u.username}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn-friend-accept"
                    onClick={() => handleAccept(u.id)}
                    aria-label={`Accepter ${u.username}`}
                  >
                    Accepter
                  </button>
                  <button
                    className="btn-friend-trash"
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

      {acceptedFriends.length > 0 && (
        <ul className="friends-list" aria-label="Mes amis">
          {acceptedFriends.map((u) => (
            <li key={u.id} className="friend-row">
              <div className="friend-info">
                <span className="friend-name">
                  {u.displayName || u.username}
                </span>
                <span className="friend-handle">@{u.username}</span>
              </div>
              <button
                className="btn-friend-trash"
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

      {acceptedFriends.length === 0 && pendingReceived.length === 0 && (
        <p
          className="muted"
          style={{ fontSize: "0.85rem", margin: "6px 0 10px" }}
        >
          Aucun ami pour l'instant.
        </p>
      )}
    </section>
  );
}
