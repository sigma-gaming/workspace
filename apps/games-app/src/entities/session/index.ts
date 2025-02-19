import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { env } from '../../shared/env'
import { createLogoutUrl } from '../provider'

function getSessionExpiresAt() {
  const expiresAt = Cookies.get('session_expires_at')
  return expiresAt ?? null
}

function isSessionActive(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) > new Date()
}

function isExpiringSoon(expiresAt: string | null) {
  if (!expiresAt) return false
  const threshold = 1000 * 60 * 60 * 24 * 7 // 7 days
  return new Date(expiresAt) < new Date(Date.now() + threshold)
}

// TODO: add session refresh
// const refreshSessionFx = createApiEffect('json', accessApi.refresh.$post)
const refreshSessionFx = createEffect(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return { expiresAt: date.toISOString() }
})

const redirectToLogoutFx = createEffect(() => {
  window.location.replace(createLogoutUrl())
})

const clientLogoutFx = createEffect(() => {
  Cookies.remove('session_expires_at', { domain: env.domain })
})

const refreshIfExpiringSoon = createEvent()
const logout = createEvent()
const clientLogout = createEvent()

const expiresAt = getSessionExpiresAt()
const $expiresAt = createStore(expiresAt)
const $loggedIn = createStore(isSessionActive(expiresAt))

sample({
  clock: refreshIfExpiringSoon,
  source: $expiresAt,
  filter: isExpiringSoon,
  target: refreshSessionFx,
})

sample({
  clock: refreshSessionFx.doneData,
  fn: ({ expiresAt }) => expiresAt,
  target: $expiresAt,
})

sample({
  clock: logout,
  target: redirectToLogoutFx,
})

sample({
  clock: clientLogout,
  target: clientLogoutFx,
})

export const $$session = {
  refreshIfExpiringSoon,
  logout,
  clientLogout,
  $loggedIn,
}
