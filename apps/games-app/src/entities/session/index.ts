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

const redirectToLogoutFx = createEffect(() => {
  window.location.replace(createLogoutUrl())
})

const clientLogoutFx = createEffect(() => {
  Cookies.remove('session_expires_at', { domain: env.domain })
})

const logout = createEvent()
const clientLogout = createEvent()

const $loggedIn = createStore(isSessionActive(getSessionExpiresAt()))

sample({
  clock: logout,
  target: redirectToLogoutFx,
})

sample({
  clock: clientLogout,
  target: clientLogoutFx,
})

export const $$session = {
  logout,
  clientLogout,
  $loggedIn,
}
