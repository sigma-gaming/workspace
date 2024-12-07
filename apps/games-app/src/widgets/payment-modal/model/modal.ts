import { createEvent, createStore } from 'effector'

export const openDeposit = createEvent()
export const openWithdraw = createEvent()
export const close = createEvent()

export const $opened = createStore(false)
  .on(openDeposit, () => true)
  .on(openWithdraw, () => true)
  .on(close, () => false)
