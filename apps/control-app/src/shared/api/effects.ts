import { createApiEffectFactory } from '@core/client'

const lastChallengeTime = Number(
  localStorage.getItem('last-cf-challenge-time') ?? '0',
)

export const createApiEffect = createApiEffectFactory({
  onCloudflareChallenge() {
    const now = Date.now()
    if (now - lastChallengeTime < 1000 * 60 * 15) return
    localStorage.setItem('last-cf-challenge-time', now.toString())
    window.location.reload() // Force user to solve challenge
  },
})
