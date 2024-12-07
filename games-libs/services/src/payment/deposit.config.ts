import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'
import { DepositConfigList, toConfigTree } from '@games/model'

export const DEPOSIT_CONFIG_LIST: DepositConfigList = [
  {
    method: DepositMethod.SBP,
    providers: [
      {
        provider: PaymentProvider.Bovapay,
        currencies: [
          {
            currency: Currency.RUB,
            entry: {
              minAmount: 1000,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
      {
        provider: PaymentProvider.Test,
        currencies: [
          {
            currency: Currency.USD,
            entry: {
              minAmount: 100,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
    ],
  },
  {
    method: DepositMethod.CreditCard,
    providers: [
      {
        provider: PaymentProvider.Bovapay,
        currencies: [
          {
            currency: Currency.RUB,
            entry: {
              minAmount: 100,
              maxAmount: 100000,
              commissionRate: 0.02,
            },
          },
        ],
      },
    ],
  },
  {
    method: DepositMethod.Piastrix,
    providers: [
      {
        provider: PaymentProvider.Bovapay,
        currencies: [
          {
            currency: Currency.RUB,
            entry: {
              minAmount: 100,
              maxAmount: 100000,
              commissionRate: 0.02,
            },
          },
        ],
      },
    ],
  },
  {
    method: DepositMethod.Toncoin,
    providers: [
      {
        provider: PaymentProvider.Bovapay,
        currencies: [
          {
            currency: Currency.RUB,
            entry: {
              minAmount: 100,
              maxAmount: 100000,
              commissionRate: 0.02,
            },
          },
        ],
      },
    ],
  },
]

export const DEPOSIT_CONFIG_TREE = toConfigTree(DEPOSIT_CONFIG_LIST)
