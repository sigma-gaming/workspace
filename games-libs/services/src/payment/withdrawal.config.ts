import { Currency, PaymentProvider, WithdrawalMethod } from '@dbs/games-types'
import { toConfigTree, WithdrawalConfigList } from '@games/model'

export const WITHDRAWAL_CONFIG_LIST: WithdrawalConfigList = [
  {
    method: WithdrawalMethod.SBP,
    providers: [
      {
        provider: PaymentProvider.Bovapay,
        currencies: [
          {
            currency: Currency.RUB,
            entry: {
              minAmount: 100,
              maxAmount: 10000,
              commissionRate: 0.05,
            },
          },
        ],
      },
    ],
  },
]

export const WITHDRAWAL_CONFIG_TREE = toConfigTree(WITHDRAWAL_CONFIG_LIST)
