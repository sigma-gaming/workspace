import { sql } from 'drizzle-orm'

export const uuidv7 = sql`uuid_generate_v7()`
