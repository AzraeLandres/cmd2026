import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($username: String!, $password: String!, $displayName: String!) {
    register(username: $username, password: $password, displayName: $displayName) {
      token
      user { id username displayName }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user { id username displayName }
    }
  }
`;

export const PLACE_BET = gql`
  mutation PlaceBet($matchId: String!, $homeScore: Int!, $awayScore: Int!) {
    placeBet(matchId: $matchId, homeScore: $homeScore, awayScore: $awayScore) {
      matchId homeScore awayScore userId username displayName
    }
  }
`;

export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($username: String!) {
    sendFriendRequest(username: $username) {
      id username displayName status
    }
  }
`;

export const ACCEPT_FRIEND_REQUEST = gql`
  mutation AcceptFriendRequest($friendId: Int!) {
    acceptFriendRequest(friendId: $friendId) {
      id username displayName status
    }
  }
`;

export const REMOVE_FRIEND = gql`
  mutation RemoveFriend($friendId: Int!) {
    removeFriend(friendId: $friendId)
  }
`;

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($message: String!) {
    sendChatMessage(message: $message)
  }
`;
