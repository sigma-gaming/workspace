import { defineConfig } from 'drizzle-kit'

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  schema: '../games-schema/src/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.GAMES_DB_HOST!,
    port: 5432,
    user: process.env.GAMES_DB_USER!,
    password: process.env.GAMES_DB_PASSWORD!,
    database: process.env.GAMES_DB_DATABASE!,
  },
  verbose: true,
  strict: true,
})
