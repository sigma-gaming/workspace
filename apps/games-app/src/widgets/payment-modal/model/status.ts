import { createEvent, createStore } from 'effector'
import { persist } from 'effector-storage/query'
import { destroy } from './shared'

export const paymentCreated = createEvent<string>()
export const closePayment = createEvent()

export const $paymentId = createStore<string | null>(null)
  .on(paymentCreated, (_, id) => id)
  .on(closePayment, () => null)
  .reset(destroy)

persist({ store: $paymentId, key: 'payment-id', timeout: 10 })
