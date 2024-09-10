import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../env';
import * as schema from './schema';

const connection = postgres({
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  host: env.DATABASE_HOST,
  port: 5432,
});

const db = drizzle(connection, { schema });

export default db;
