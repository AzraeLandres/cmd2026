import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Match {
    id:        String!
    homeTeam:  String!
    awayTeam:  String!
    homeScore: Int!
    awayScore: Int!
    status:    String!
    minute:    Int!
    phase:     String
    stage:     String
    venue:     String
    date:      String
    events:    [MatchEvent!]!
    lineups:   Lineups
  }

  type MatchEvent {
    minute:  Int!
    type:    String!
    team:    String!
    player:  String
    penalty: Boolean
  }

  type Lineups {
    home: [String!]!
    away: [String!]!
  }

  type User {
    id:          Int!
    username:    String!
    displayName: String!
  }

  type AuthPayload {
    token: String!
    user:  User!
  }

  type Bet {
    matchId:     String!
    homeScore:   Int!
    awayScore:   Int!
    userId:      Int!
    username:    String!
    displayName: String!
  }

  type Friend {
    id:          Int!
    username:    String!
    displayName: String!
    status:      String!
  }

  type Query {
    matches(phase: String): [Match!]!
    match(id: String!):     Match
    phases:                 [String!]!
    mode:                   String!
    me:                     User
    bets(matchId: String!): [Bet!]!
    allBets:                [Bet!]!
    friends:                [Friend!]!
  }

  type Mutation {
    register(username: String!, password: String!, displayName: String!): AuthPayload!
    login(username: String!,    password: String!):                        AuthPayload!
    placeBet(matchId: String!, homeScore: Int!, awayScore: Int!):          Bet!
    sendFriendRequest(username: String!):     Friend!
    acceptFriendRequest(friendId: Int!):      Friend!
    removeFriend(friendId: Int!):             Boolean!
    sendChatMessage(message: String!):        String!
  }
`;
