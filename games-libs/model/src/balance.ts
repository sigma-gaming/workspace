import { clampNumber } from '@core/utils'
import { Update } from './updates'

export type BalanceDetailed = {
  available: number
}

export type BalanceUpdate = Update & BalanceDetailed

export function gemInt(amount: number) {
  return amount * 100
}

export function gemFloat(amount: number) {
  return amount / 100
}

const formatter0Digits = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

const formatter1Digits = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
})

const formatter2Digits = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
})

export function formatGem(number: number | bigint, digits = 2) {
  if (digits === 0) return formatter0Digits.format(number)
  if (digits === 1) return formatter1Digits.format(number)
  return formatter2Digits.format(number)
}

export function clampBet(payload: {
  bet: number
  min: number
  max: number
  balance: number
}) {
  const { bet, min, max, balance } = payload
  return clampNumber(min, bet, clampNumber(min, balance, max))
}
