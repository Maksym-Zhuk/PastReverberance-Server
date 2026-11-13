import './env';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'path';

export default async function globalSetup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: join(__dirname, '../drizzle'),
    });
  } finally {
    await pool.end();
  }
}
