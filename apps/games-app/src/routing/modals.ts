import { createEvent, createStore } from 'effector'
import { persist } from 'effector-storage/query'

const open = createEvent<string>()
const close = createEvent()

const $active = createStore<string | null>(null)
  .on(open, (_, modal) => modal)
  .on(close, () => null)

persist({ store: $active, key: 'modal', timeout: 10 })

export const $$modals = {
  $active,
  open,
  close,
}
