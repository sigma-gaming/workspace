import { $$modals } from 'apps/games-app/src/routing'

export enum Operation {
  Deposit = 'deposit',
  Withdrawal = 'withdrawal',
}

const openDeposit = $$modals.open.prepend(() => Operation.Deposit)
const openWithdrawal = $$modals.open.prepend(() => Operation.Withdrawal)
const close = $$modals.close

const $opened = $$modals.$active.map((modal) => {
  return modal === Operation.Deposit || modal === Operation.Withdrawal
})

export const $$paymentModal = {
  $opened,
  openDeposit,
  openWithdrawal,
  close,
}
