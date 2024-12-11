import Cookie from 'js-cookie'
import { env } from './shared/env'

const existingSticky = Cookie.get('sticky')
let expired = false
let nextRandom: string | null = null

if (existingSticky) {
  const [random, expiresAt] = existingSticky.split('@')

  if (random && expiresAt) {
    const expiresDate = new Date(expiresAt)

    if (new Date() > expiresDate) {
      expired = true
      nextRandom = random
    }
  } else {
    expired = true
  }
} else {
  expired = true
}

if (expired) {
  const nextExpiresAt = new Date()
  nextExpiresAt.setHours(nextExpiresAt.getHours() + 2)
  const random =
    nextRandom ?? Math.random().toString().padEnd(20, '0').slice(2, 10)
  Cookie.set('sticky', random + '@' + nextExpiresAt.toISOString(), {
    domain: env.domain,
  })
}
