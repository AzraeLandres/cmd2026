export default interface MatchEvent {
  minute: number;
  type: string;
  team: string;
  player?: string | null;
  assist?: string | null;
  penalty?: boolean;
  ownGoal?: boolean;
}
