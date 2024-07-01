import { subscriptionFactory } from '@core/io-client'
import { invoke } from '@withease/factories'
import { createEffect, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { delay } from 'patronum'
import { gamesWs } from '../../shared/api/games-ws'
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

const { receivedData: maintenanceStarted } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'maintenance/started' })
})

const reloadAt = Cookies.get('maintenanceReloadAt')
const $active = createStore(Boolean(reloadAt)).on(
  maintenanceStarted,
  () => true,
)

sample({
  clock: maintenanceStarted,
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
  $active,
}
