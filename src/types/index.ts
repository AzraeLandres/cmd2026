export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELED';

export interface MatchEvent {
  type:         string;
  minute:       number;
  team:         string;
  player?:      string | null;
  assistPlayer?: string | null;
  penalty?:     boolean;
}

export interface Lineups {
  home: string[];
  away: string[];
}

export interface Match {
  id:        string;
  homeTeam:  string;
  awayTeam:  string;
  status:    MatchStatus;
  homeScore: number;
  awayScore: number;
  date:      string;
  minute:    number;
  phase?:    string;
  stage?:    string;
  venue?:    string;
  events:    MatchEvent[];
  lineups?:  Lineups;
}

export interface User {
  id:          number;
  username:    string;
  displayName: string;
}

export interface Bet {
  matchId:     string;
  homeScore:   number;
  awayScore:   number;
  userId:      number;
  username:    string;
  displayName: string;
}

export interface Friend {
  id:          number;
  username:    string;
  displayName: string;
  status:      string;
  direction:   'incoming' | 'outgoing';
}

export interface AuthPayload {
  token: string;
  user:  User;
}

export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface GraphQLContext {
  user: User | null;
}
