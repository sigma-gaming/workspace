export interface BalanceDetailed {
  available: number
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
  Bet = 'Bet',
  Win = 'Win',
  Loss = 'Loss',
}

export function rub(amount: number) {
  return amount * 100
}
