import { Pool } from 'pg';
import { config } from './config';

// Rôle restreint côté runtime (SELECT/INSERT/UPDATE/DELETE) — voir migrate.ts
// pour la création du schéma et du rôle applicatif.
const pool: Pool | null = config.appDatabaseUrl
  ? new Pool({ connectionString: config.appDatabaseUrl })
  : null;

export const db = pool;
