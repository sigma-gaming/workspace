import { subscriptionFactory } from '@core/io-client'
import { invoke } from '@withease/factories'
import { createEffect, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { delay } from 'patronum'
import { gamesWs } from '../../shared/api/games-ws'
import { env } from '../../shared/env'

const MAX_SECONDS_PREPARING = 30
const SECONDS_BEFORE_RELOAD = 5

/**
 * Saves maintenance between page reloads
 * (in case when API healthcheck was executed before APP healthcheck)
 */
const saveToCookieFx = createEffect(() => {
  const preparedAt = new Date()
  preparedAt.setSeconds(preparedAt.getSeconds() + MAX_SECONDS_PREPARING)

  Cookies.set('maintenancePreparing', '1', {
    domain: env.domain,
    expires: preparedAt,
  })
})

const reloadPageFx = createEffect(() => {
  window.location.reload()
})

const { receivedData: maintenanceStarted } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'maintenance/started' })
})

const maintenancePreparing = Cookies.get('maintenancePreparing')

const $active = createStore(Boolean(maintenancePreparing)).on(
  maintenanceStarted,
  () => true,
)

sample({
  clock: maintenanceStarted,
  target: saveToCookieFx,
})

const requestedReload = sample({
  source: delay($active, SECONDS_BEFORE_RELOAD * 1000),
  filter: Boolean,
})

sample({
  clock: requestedReload,
  target: reloadPageFx,
})

export const $$maintenance = {
  $active,
}
