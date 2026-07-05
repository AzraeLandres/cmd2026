import { db } from '../lib/db';
import { GraphQLContext } from '../types';
import { GraphQLError } from 'graphql';

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.user;
}

function requireDb() {
  if (!db) throw new GraphQLError('Base de données non configurée', { extensions: { code: 'UNAVAILABLE' } });
  return db;
}

async function getFavoritesForUser(userId: number): Promise<string[]> {
  const pool = requireDb();
  const result = await pool.query(
    'SELECT team FROM favorites WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  return result.rows.map((row: Record<string, unknown>) => String(row.team));
}

export const favoritesResolvers = {
  Query: {
    async favorites(_: unknown, _args: unknown, ctx: GraphQLContext): Promise<string[]> {
      const user = requireAuth(ctx);
      return getFavoritesForUser(user.id);
    },
  },

  Mutation: {
    async addFavorite(_: unknown, args: { team: string }, ctx: GraphQLContext): Promise<string[]> {
      const user = requireAuth(ctx);
      const pool = requireDb();
      const team = args.team.trim();
      if (!team) throw new GraphQLError('Équipe invalide');

      await pool.query(
        'INSERT INTO favorites (user_id, team) VALUES ($1, $2) ON CONFLICT (user_id, team) DO NOTHING',
        [user.id, team]
      );
      return getFavoritesForUser(user.id);
    },

    async removeFavorite(_: unknown, args: { team: string }, ctx: GraphQLContext): Promise<string[]> {
      const user = requireAuth(ctx);
      const pool = requireDb();

      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND team = $2', [user.id, args.team]);
      return getFavoritesForUser(user.id);
    },
  },
};
