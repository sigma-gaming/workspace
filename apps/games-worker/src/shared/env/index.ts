import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().transform(Number).default('5051'),
    RABBITMQ_URL: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    port: raw.PORT,
    rabbitmq: {
      url: raw.RABBITMQ_URL,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
