import { defineConfig } from 'drizzle-kit'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  schema: '../db-schema/src/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
