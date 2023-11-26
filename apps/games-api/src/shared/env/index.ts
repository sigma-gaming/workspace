import path from 'path'
import dotenv from 'dotenv'
import { z, ZodError } from 'zod'

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.development') })
}

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
}

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().transform(Number).default('5050'),

    DOMAIN: z.string(),
    CLIENT_URL: z.string(),
    JWT_SECRET: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
    VK_APP_SECRET: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    port: raw.PORT,
    domain: raw.DOMAIN,
    client: {
      url: raw.CLIENT_URL,
    },
    jwt: {
      secret: raw.JWT_SECRET,
    },
    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
      botToken: raw.TELEGRAM_BOT_TOKEN,
    },
    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
      appSecret: raw.VK_APP_SECRET,
    },
  }))

let parsed: z.infer<typeof EnvSchema>

try {
  parsed = EnvSchema.parse(process.env)
} catch (error) {
  if (error instanceof ZodError) console.error(`Invalid env:`, error.issues)
  else console.error(error)
  process.exit(1)
}

export const env = parsed
