export type BalanceDetailed = {
  available: number
}

export function gemInt(amount: number) {
  return amount * 100
}

export function gemFloat(amount: number) {
  return amount / 100
}

const formatter0Digits = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const formatter1Digits = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

const formatter2Digits = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

export function formatGem(number: number | bigint, digits = 2) {
  if (digits === 0) return formatter0Digits.format(number)
  if (digits === 1) return formatter1Digits.format(number)
  return formatter2Digits.format(number)
}
