export type BalanceDetailed = {
  available: number
}

export function gemInt(amount: number) {
  return amount * 100
}

export function gemFloat(amount: number) {
  return amount / 100
}
