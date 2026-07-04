import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useHeader } from "@context/HeaderContext";
import { GET_MATCH } from "@graphql/queries";
import ScoreBlock from "@organisms/ScoreBlock";
import EventRow from "@molecules/EventRow";
import TeamLineup from "@molecules/TeamLineup";
import EmptyState from "@atoms/EmptyState";
import SectionTitle from "@atoms/SectionTitle";
import BetSection from "./BetSection";

const POLL_INTERVAL_MS = 5_000;

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const setHeader = useHeader();

  const { data, loading, error, startPolling, stopPolling } = useQuery(
    GET_MATCH,
    { variables: { id }, skip: !id, fetchPolicy: "cache-and-network" },
  );

  const match = data?.match;

  useEffect(() => {
    if (!match) return;
    setHeader({
      title: `${match.homeTeam} vs ${match.awayTeam}`,
      liveMinute: match.status === "LIVE" ? match.minute : null,
    });

    if (match.status === "LIVE" || match.status === "SUSPENDED") {
      startPolling(POLL_INTERVAL_MS);
    } else {
      stopPolling();
    }
  }, [match, setHeader, startPolling, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  if (error) return <EmptyState role="alert">Match introuvable.</EmptyState>;
  if (loading) return <EmptyState>Chargement…</EmptyState>;
  if (!match) return <EmptyState>Match introuvable.</EmptyState>;

  const goals = (match.events ?? []).filter(
    (e: { type: string }) => e.type === "GOAL",
  );
  const cards = (match.events ?? []).filter(
    (e: { type: string }) => e.type === "YELLOW_CARD" || e.type === "RED_CARD",
  );
  const allEvents = [...goals, ...cards].sort(
    (a: { minute: number }, b: { minute: number }) => a.minute - b.minute,
  );

  return (
    <>
      <ScoreBlock match={match} />

      {allEvents.length > 0 && (
        <div className="mb-4">
          <SectionTitle>Événements</SectionTitle>
          {allEvents.map((ev: any, i: number) => (
            <EventRow key={i} event={ev} />
          ))}
        </div>
      )}

      {match.lineups &&
        (match.lineups.home?.length > 0 || match.lineups.away?.length > 0) && (
          <div className="mb-4">
            <SectionTitle>Compositions</SectionTitle>
            <TeamLineup
              team={match.homeTeam}
              players={match.lineups.home ?? []}
            />
            <TeamLineup
              team={match.awayTeam}
              players={match.lineups.away ?? []}
            />
          </div>
        )}

      <BetSection matchId={id!} matchStatus={match.status} match={match} />
    </>
  );
}
