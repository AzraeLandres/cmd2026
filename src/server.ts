import express from 'express';
import path from 'path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs }   from './schema';
import { resolvers }  from './resolvers';
import { initDb }     from './lib/db';
import { config }     from './lib/config';
import { extractUserIdFromHeader } from './lib/auth';
import { GraphQLContext, User } from './types';

const PORT = config.port;

async function resolveUserFromToken(authHeader: string | undefined): Promise<User | null> {
  const userId = extractUserIdFromHeader(authHeader);
  if (!userId) return null;

  const { db } = await import('./lib/db');
  if (!db) return null;

  try {
    const result = await db.query(
      'SELECT id, username, display_name FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return { id: row.id, username: row.username, displayName: row.display_name };
  } catch {
    return null;
  }
}

async function startServer(): Promise<void> {
  await initDb();

  const apollo = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
  await apollo.start();

  const app = express();
  app.set('trust proxy', 1); // derrière Caddy — nécessaire pour un req.ip correct (rate-limiting par IP)
  app.use(express.json());

  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const user = await resolveUserFromToken(req.headers.authorization);
        const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
        return { user, ip };
      },
    })
  );

  app.use(express.static(config.publicDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.listen(PORT, () => {
    const mode = config.footballApiKey ? 'live' : 'demo';
    const db   = config.databaseUrl    ? 'PostgreSQL' : 'désactivée';
    console.log(`CDM 2026 démarré sur le port ${PORT} (mode: ${mode}, BDD: ${db})`);
    console.log(`GraphQL disponible sur http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Erreur au démarrage :', err);
  process.exit(1);
});
