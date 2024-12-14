import { defineConfig } from 'drizzle-kit'

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  schema: '../games-schema/src/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.GAMES_DB_URL!,
  },
  verbose: true,
  strict: true,
})
