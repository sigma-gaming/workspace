export interface BalanceDetailed {
  available: number
}

export function gem(amount: number) {
  return amount * 100
}
