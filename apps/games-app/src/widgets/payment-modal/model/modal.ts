import { $$modals } from 'apps/games-app/src/routing'
import { createStore, sample } from 'effector'
import { initialize } from './shared'

export enum Operation {
  Deposit = 'deposit',
  Withdrawal = 'withdrawal',
}

function isPaymentModal(modal: string | null): modal is Operation {
  return modal === Operation.Deposit || modal === Operation.Withdrawal
}

export const openDeposit = $$modals.open.prepend(() => Operation.Deposit)
export const openWithdrawal = $$modals.open.prepend(() => Operation.Withdrawal)
export const chooseOperation = $$modals.open.prepend(
  (operation: Operation) => operation,
)

export const $operation = createStore<Operation | null>(null)

sample({
  clock: [$$modals.$active, initialize],
  source: $$modals.$active,
  filter: isPaymentModal,
  target: $operation,
})

export const $opened = $$modals.$active.map(isPaymentModal)
