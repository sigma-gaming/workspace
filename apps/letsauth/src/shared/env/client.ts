import { parseEnv } from '@tooling/env/client'
import { z } from 'zod'

const PublicEnvSchema = z
  .object({
    PUBLIC_AUTH_API_DOMAIN: z.string(),
    PUBLIC_AUTH_API_URL: z.string(),
    PUBLIC_AUTH_API_VERSION: z.string().default('unknown'),
  })
  .transform((raw) => ({
    authApi: {
      url: raw.PUBLIC_AUTH_API_URL,
    },
  }))

if (process.env.NODE_ENV === 'development') {
  const response = await fetch('/env.js')
  const text = await response.text()
  const json = text.slice(text.indexOf('{'))
  window.PUBLIC_ENV = JSON.parse(json)
}

export const publicEnv = parseEnv({
  source: window.PUBLIC_ENV,
  schema: PublicEnvSchema,
})
