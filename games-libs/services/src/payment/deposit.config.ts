import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'
import { DepositConfigList, toConfigTree } from '@games/model'

export const DEPOSIT_CONFIG_LIST: DepositConfigList = [
  {
    method: DepositMethod.SBP,
    isP2p: true,
    currencies: [
      {
        currency: Currency.RUB,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
            entry: {
              minAmount: 10000,
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
    isP2p: true,
    currencies: [
      {
        currency: Currency.RUB,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
            entry: {
              minAmount: 10000,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
      {
        currency: Currency.KGS,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
            entry: {
              minAmount: 10000,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
      {
        currency: Currency.UZS,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
            entry: {
              minAmount: 10000,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
    ],
  },
  {
    method: DepositMethod.Piastrix,
    currencies: [
      {
        currency: Currency.RUB,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
            entry: {
              minAmount: 100,
              maxAmount: 100000,
              commissionRate: 0.02,
            },
          },
        ],
      },
      {
        currency: Currency.USD,
        providers: [
          {
            provider: PaymentProvider.Test,
            entry: {
              minAmount: 1000,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
      {
        currency: Currency.EUR,
        providers: [
          {
            provider: PaymentProvider.Test,
            entry: {
              minAmount: 1000,
              maxAmount: 10000000,
              commissionRate: 0.02,
            },
          },
        ],
      },
    ],
  },
  {
    method: DepositMethod.Toncoin,
    currencies: [
      {
        currency: Currency.TON,
        only: true,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
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
