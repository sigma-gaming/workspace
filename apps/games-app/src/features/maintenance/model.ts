import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { env } from '../../shared/env'

/**
 * Saves maintenance between page reloads
 * (in case when API healthcheck was executed before APP healthcheck)
 */
const saveToCookieFx = createEffect(() => {
  const expires = new Date()
  expires.setSeconds(expires.getSeconds() + 5)
  Cookies.set('maintenance', String(true), { domain: env.domain, expires })
})

const activate = createEvent()

const initialActive = Cookies.get('maintenance') === 'true'
const $active = createStore(initialActive).on(activate, () => true)

sample({
  clock: activate,
  target: saveToCookieFx,
})

export const $$maintenance = {
  activate,
  $active,
}
