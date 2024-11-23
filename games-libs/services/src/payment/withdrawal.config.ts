import { Currency, PaymentProvider, WithdrawalMethod } from '@dbs/games-types'

export type WithdrawalBundleConfig = {
  minAmount?: number
  maxAmount?: number
  commissionRate?: number
}

export type WithdrawalConfig = {
  [method in WithdrawalMethod]?: {
    [provider in PaymentProvider]?: {
      [currency in Currency]?: WithdrawalBundleConfig
    }
  }
}

export const WITHDRAWAL_CONFIG: WithdrawalConfig = {
  [WithdrawalMethod.SBP]: {
    [PaymentProvider.Bovapay]: {
      [Currency.RUB]: {
        minAmount: 1000,
        maxAmount: 100000,
        commissionRate: 0.03,
      },
    },
  },
}
