import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'

export type DepositBundleConfig = {
  minAmount?: number
  maxAmount?: number
  commissionRate?: number
}

export type DepositConfig = {
  [method in DepositMethod]?: {
    [provider in PaymentProvider]?: {
      [currency in Currency]?: DepositBundleConfig
    }
  }
}

export const DEPOSIT_CONFIG: DepositConfig = {
  [DepositMethod.SBP]: {
    [PaymentProvider.Bovapay]: {
      [Currency.RUB]: {
        minAmount: 100,
        maxAmount: 100000,
        commissionRate: 0.02,
      },
    },
  },
}
