import MatchEvent from "./MatchEvent";
import Lineups from "./Lineups";

export default interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number;
  date: string;
  stage: string;
  phase?: string;
  venue?: string;
  events?: MatchEvent[];
  lineups?: Lineups;
}
