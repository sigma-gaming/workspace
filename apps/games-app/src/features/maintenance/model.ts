import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { delay } from 'patronum'
import { env } from '../../shared/env'

/**
 * Saves maintenance between page reloads
 * (in case when API healthcheck was executed before APP healthcheck)
 */
const saveToCookieFx = createEffect(() => {
  const reloadAt = new Date()
  reloadAt.setSeconds(reloadAt.getSeconds() + 5)

  Cookies.set('maintenanceReloadAt', reloadAt.toISOString(), {
    domain: env.domain,
    expires: reloadAt,
  })
})

const reloadPageFx = createEffect(() => {
  window.location.reload()
})

const activate = createEvent()

const reloadAt = Cookies.get('maintenanceReloadAt')
const $active = createStore(Boolean(reloadAt)).on(activate, () => true)

sample({
  clock: activate,
  target: saveToCookieFx,
})

const msBeforeReload = reloadAt
  ? new Date(reloadAt).getTime() - new Date().getTime()
  : 5000

const requestedReload = sample({
  source: delay($active, msBeforeReload),
  filter: Boolean,
})

sample({
  clock: requestedReload,
  target: reloadPageFx,
})

export const $$maintenance = {
  activate,
  $active,
}
