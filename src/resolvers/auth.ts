import { hashPassword, verifyPassword, createToken } from '../lib/auth';
import { db } from '../lib/db';
import { isRateLimited } from '../lib/rateLimit';
import { GraphQLContext, AuthPayload } from '../types';
import { GraphQLError } from 'graphql';

const LOGIN_LIMIT           = 10;
const LOGIN_WINDOW_MS       = 5 * 60 * 1000;
const REGISTER_LIMIT        = 5;
const REGISTER_WINDOW_MS    = 60 * 60 * 1000;

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.user;
}

function requireNotRateLimited(ip: string, action: string, limit: number, windowMs: number): void {
  if (isRateLimited(`${action}:${ip}`, limit, windowMs)) {
    throw new GraphQLError('Trop de tentatives, réessayez plus tard', { extensions: { code: 'RATE_LIMITED' } });
  }
}

interface RegisterArgs {
  username:    string;
  password:    string;
  displayName: string;
}

interface LoginArgs {
  username: string;
  password: string;
}

export const authResolvers = {
  Query: {
    me(_: unknown, _args: unknown, ctx: GraphQLContext) {
      return ctx.user ?? null;
    },
  },

  Mutation: {
    async register(_: unknown, args: RegisterArgs, ctx: GraphQLContext): Promise<AuthPayload> {
      requireNotRateLimited(ctx.ip, 'register', REGISTER_LIMIT, REGISTER_WINDOW_MS);
      if (!db) throw new GraphQLError('Base de données non configurée', { extensions: { code: 'UNAVAILABLE' } });

      const trimmedUsername = args.username.trim().toLowerCase();
      const trimmedDisplay  = args.displayName.trim();

      if (trimmedUsername.length < 3)  throw new GraphQLError('Nom d\'utilisateur trop court (3 car. min.)');
      if (args.password.length < 6)    throw new GraphQLError('Mot de passe trop court (6 car. min.)');
      if (!trimmedDisplay)             throw new GraphQLError('Nom d\'affichage requis');

      const existing = await db.query('SELECT id FROM users WHERE username = $1', [trimmedUsername]);
      if (existing.rows.length > 0)    throw new GraphQLError('Nom d\'utilisateur déjà pris');

      const passwordHash = await hashPassword(args.password);
      const result = await db.query(
        'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name',
        [trimmedUsername, passwordHash, trimmedDisplay]
      );

      const row   = result.rows[0];
      const user  = { id: row.id, username: row.username, displayName: row.display_name };
      const token = createToken(user.id);
      return { token, user };
    },

    async login(_: unknown, args: LoginArgs, ctx: GraphQLContext): Promise<AuthPayload> {
      requireNotRateLimited(ctx.ip, 'login', LOGIN_LIMIT, LOGIN_WINDOW_MS);
      if (!db) throw new GraphQLError('Base de données non configurée', { extensions: { code: 'UNAVAILABLE' } });

      const trimmedUsername = args.username.trim().toLowerCase();
      const result = await db.query(
        'SELECT id, username, display_name, password_hash FROM users WHERE username = $1',
        [trimmedUsername]
      );

      if (result.rows.length === 0) throw new GraphQLError('Identifiants incorrects');

      const row           = result.rows[0];
      const passwordValid = await verifyPassword(row.password_hash, args.password);
      if (!passwordValid) throw new GraphQLError('Identifiants incorrects');

      const user  = { id: row.id, username: row.username, displayName: row.display_name };
      const token = createToken(user.id);
      return { token, user };
    },

    async deleteAccount(_: unknown, _args: unknown, ctx: GraphQLContext): Promise<boolean> {
      const user = requireAuth(ctx);
      if (!db) throw new GraphQLError('Base de données non configurée', { extensions: { code: 'UNAVAILABLE' } });

      await db.query('DELETE FROM users WHERE id = $1', [user.id]);
      return true;
    },
  },
};
