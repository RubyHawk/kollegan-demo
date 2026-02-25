import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// Next.js convention: .env.local takes priority, then .env
// The `config` calls run before defineConfig reads process.env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    '\n[prisma.config.ts] DATABASE_URL is not set.\n' +
    'Add it to .env.local (for local dev) or .env before running Prisma CLI commands.\n' +
    'Example: DATABASE_URL=postgresql://user:password@localhost:5432/kollegan_db\n'
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
