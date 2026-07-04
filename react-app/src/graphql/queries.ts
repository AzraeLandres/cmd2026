import { gql } from '@apollo/client';

export const GET_MATCHES = gql`
  query GetMatches($phase: String) {
    matches(phase: $phase) {
      id homeTeam awayTeam homeScore awayScore status minute phase stage date venue
    }
  }
`;

export const GET_MATCH = gql`
  query GetMatch($id: String!) {
    match(id: $id) {
      id homeTeam awayTeam homeScore awayScore status minute phase stage date venue
      events { minute type team player penalty }
      lineups { home away }
    }
  }
`;

export const GET_PHASES = gql`
  query GetPhases { phases }
`;

export const GET_MODE = gql`
  query GetMode { mode }
`;

export const GET_ME = gql`
  query GetMe {
    me { id username displayName }
  }
`;

export const GET_BETS = gql`
  query GetBets($matchId: String!) {
    bets(matchId: $matchId) {
      matchId homeScore awayScore userId username displayName
    }
  }
`;

export const GET_ALL_BETS = gql`
  query GetAllBets {
    allBets { matchId homeScore awayScore userId username displayName }
  }
`;

export const GET_FRIENDS = gql`
  query GetFriends {
    friends { id username displayName status }
  }
`;
