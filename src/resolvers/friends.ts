import { db } from '../lib/db';
import { GraphQLContext, Friend } from '../types';
import { GraphQLError } from 'graphql';

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.user;
}

function requireDb() {
  if (!db) throw new GraphQLError('Base de données non configurée', { extensions: { code: 'UNAVAILABLE' } });
  return db;
}

export const friendsResolvers = {
  Query: {
    async friends(_: unknown, _args: unknown, ctx: GraphQLContext): Promise<Friend[]> {
      const user = requireAuth(ctx);
      const pool = requireDb();

      const result = await pool.query(
        `SELECT
           u.id, u.username, u.display_name,
           f.status,
           CASE WHEN f.requester_id = $1 THEN 'outgoing' ELSE 'incoming' END AS direction
         FROM friends f
         JOIN users u ON u.id = CASE
           WHEN f.requester_id = $1 THEN f.addressee_id
           ELSE f.requester_id
         END
         WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         ORDER BY u.display_name`,
        [user.id]
      );

      return result.rows.map((row: Record<string, unknown>) => ({
        id:          Number(row.id),
        username:    String(row.username),
        displayName: String(row.display_name),
        status:      String(row.status),
        direction:   row.direction === 'outgoing' ? 'outgoing' : 'incoming',
      }));
    },
  },

  Mutation: {
    async sendFriendRequest(_: unknown, args: { username: string }, ctx: GraphQLContext): Promise<Friend> {
      const user = requireAuth(ctx);
      const pool = requireDb();

      const targetResult = await pool.query(
        'SELECT id, username, display_name FROM users WHERE username = $1',
        [args.username.trim().toLowerCase()]
      );
      if (targetResult.rows.length === 0) throw new GraphQLError('Utilisateur introuvable');

      const target = targetResult.rows[0];
      if (target.id === user.id) throw new GraphQLError('Vous ne pouvez pas vous ajouter vous-même');

      const existingResult = await pool.query(
        'SELECT status FROM friends WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)',
        [user.id, target.id]
      );
      if (existingResult.rows.length > 0) throw new GraphQLError('Demande déjà envoyée ou ami déjà ajouté');

      await pool.query(
        'INSERT INTO friends (requester_id, addressee_id, status) VALUES ($1, $2, $3)',
        [user.id, target.id, 'pending']
      );

      return {
        id: target.id,
        username: target.username,
        displayName: target.display_name,
        status: 'pending',
        direction: 'outgoing',
      };
    },

    async acceptFriendRequest(_: unknown, args: { friendId: number }, ctx: GraphQLContext): Promise<Friend> {
      const user = requireAuth(ctx);
      const pool = requireDb();

      const result = await pool.query(
        `UPDATE friends SET status='accepted'
         WHERE requester_id=$1 AND addressee_id=$2 AND status='pending'
         RETURNING requester_id`,
        [args.friendId, user.id]
      );
      if (result.rows.length === 0) throw new GraphQLError('Demande introuvable ou déjà traitée');

      const friendResult = await pool.query(
        'SELECT id, username, display_name FROM users WHERE id=$1',
        [args.friendId]
      );
      const friend = friendResult.rows[0];
      return {
        id: friend.id,
        username: friend.username,
        displayName: friend.display_name,
        status: 'accepted',
        direction: 'incoming',
      };
    },

    async removeFriend(_: unknown, args: { friendId: number }, ctx: GraphQLContext): Promise<boolean> {
      const user = requireAuth(ctx);
      const pool = requireDb();

      await pool.query(
        'DELETE FROM friends WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)',
        [user.id, args.friendId]
      );
      return true;
    },
  },
};
