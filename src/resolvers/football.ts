import { getMatches, getMatchById, VALID_PHASES } from '../lib/football';
import { config } from '../lib/config';
import { isValidId } from '../lib/http';
import { GraphQLContext } from '../types';
import { GraphQLError } from 'graphql';

export const footballResolvers = {
  Query: {
    async matches(_: unknown, args: { phase?: string }, _ctx: GraphQLContext) {
      const allMatches = await getMatches();
      if (!args.phase) return allMatches;
      return allMatches.filter((m) => m.stage === args.phase);
    },

    async match(_: unknown, args: { id: string }, _ctx: GraphQLContext) {
      if (!isValidId(args.id)) throw new GraphQLError('Identifiant de match invalide');
      return getMatchById(args.id);
    },

    async phases(_: unknown, _args: unknown, _ctx: GraphQLContext) {
      const allMatches = await getMatches();
      const foundPhases = new Set(allMatches.map((m) => m.stage).filter(Boolean));
      return Array.from(VALID_PHASES).filter((p) => foundPhases.has(p));
    },

    mode(_: unknown, _args: unknown, _ctx: GraphQLContext) {
      return config.footballApiKey ? 'live' : 'demo';
    },
  },
};
