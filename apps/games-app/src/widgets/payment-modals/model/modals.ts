import { createEvent, createStore } from 'effector'

export const openDeposit = createEvent()
export const closeDeposit = createEvent()
export const openWithdraw = createEvent()
export const closeWithdraw = createEvent()

export const $depositOpened = createStore(false)
  .on(openDeposit, () => true)
  .on(closeDeposit, () => false)

export const $withdrawOpened = createStore(false)
  .on(openWithdraw, () => true)
  .on(closeWithdraw, () => false)
