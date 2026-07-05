import { db } from '../lib/db';
import { getMatchById } from '../lib/football';
import { isValidId } from '../lib/http';
import { GraphQLContext, Bet } from '../types';
import { GraphQLError } from 'graphql';

interface PlaceBetArgs {
  matchId:   string;
  homeScore: number;
  awayScore: number;
}

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.user;
}

function requireDb() {
  if (!db) throw new GraphQLError('Base de données non configurée', { extensions: { code: 'UNAVAILABLE' } });
  return db;
}

function rowToBet(row: Record<string, unknown>): Bet {
  return {
    matchId:     String(row.match_id),
    homeScore:   Number(row.home_score),
    awayScore:   Number(row.away_score),
    userId:      Number(row.user_id),
    username:    String(row.username),
    displayName: String(row.display_name),
  };
}

async function getVisibleUserIds(userId: number): Promise<number[]> {
  const pool = requireDb();
  const friendsResult = await pool.query(
    `SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END AS friend_id
     FROM friends
     WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
    [userId]
  );
  const friendIds = friendsResult.rows.map((r: Record<string, unknown>) => Number(r.friend_id));
  return [userId, ...friendIds];
}

export const betsResolvers = {
  Query: {
    async bets(_: unknown, args: { matchId: string }, ctx: GraphQLContext): Promise<Bet[]> {
      if (!isValidId(args.matchId)) throw new GraphQLError('Identifiant de match invalide');
      const user = requireAuth(ctx);
      const pool = requireDb();
      const visibleUserIds = await getVisibleUserIds(user.id);

      const result = await pool.query(
        `SELECT b.match_id, b.home_score, b.away_score, u.id AS user_id, u.username, u.display_name
         FROM bets b JOIN users u ON u.id = b.user_id
         WHERE b.match_id = $1 AND b.user_id = ANY($2)
         ORDER BY b.updated_at DESC`,
        [args.matchId, visibleUserIds]
      );
      return result.rows.map(rowToBet);
    },

    async allBets(_: unknown, _args: unknown, ctx: GraphQLContext): Promise<Bet[]> {
      const user = requireAuth(ctx);
      const pool = requireDb();
      const visibleUserIds = await getVisibleUserIds(user.id);

      const result = await pool.query(
        `SELECT b.match_id, b.home_score, b.away_score, u.id AS user_id, u.username, u.display_name
         FROM bets b JOIN users u ON u.id = b.user_id
         WHERE b.user_id = ANY($1)
         ORDER BY b.updated_at DESC`,
        [visibleUserIds]
      );
      return result.rows.map(rowToBet);
    },
  },

  Mutation: {
    async placeBet(_: unknown, args: PlaceBetArgs, ctx: GraphQLContext): Promise<Bet> {
      if (!isValidId(args.matchId)) throw new GraphQLError('Identifiant de match invalide');
      const user = requireAuth(ctx);
      const pool = requireDb();

      if (args.homeScore < 0 || args.awayScore < 0) throw new GraphQLError('Scores invalides');

      const match = await getMatchById(args.matchId);
      if (!match) throw new GraphQLError('Match introuvable');
      if (match.status !== 'SCHEDULED') {
        throw new GraphQLError('Ce match a déjà commencé, impossible de parier');
      }

      await pool.query(
        `INSERT INTO bets (user_id, match_id, home_score, away_score)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, match_id) DO UPDATE SET home_score=$3, away_score=$4, updated_at=NOW()`,
        [user.id, args.matchId, args.homeScore, args.awayScore]
      );

      return {
        matchId:     args.matchId,
        homeScore:   args.homeScore,
        awayScore:   args.awayScore,
        userId:      user.id,
        username:    user.username,
        displayName: user.displayName,
      };
    },
  },
};
