import { defineConfig } from 'drizzle-kit'

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  schema: '../games-schema/src/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
})
