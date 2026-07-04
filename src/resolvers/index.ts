import { footballResolvers } from './football';
import { authResolvers }     from './auth';
import { betsResolvers }     from './bets';
import { friendsResolvers }  from './friends';
import { chatResolvers }     from './chat';

export const resolvers = {
  Query: {
    ...footballResolvers.Query,
    ...authResolvers.Query,
    ...betsResolvers.Query,
    ...friendsResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...betsResolvers.Mutation,
    ...friendsResolvers.Mutation,
    ...chatResolvers.Mutation,
  },
};
