import { Currency, PaymentProvider, WithdrawalMethod } from '@dbs/games-types'
import { toConfigTree, WithdrawalConfigList } from '@games/model'

export const WITHDRAWAL_CONFIG_LIST: WithdrawalConfigList = [
  {
    method: WithdrawalMethod.SBP,
    currencies: [
      {
        currency: Currency.RUB,
        providers: [
          {
            provider: PaymentProvider.Bovapay,
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

export const WITHDRAWAL_STALE_TIMEOUTS: Record<PaymentProvider, number> = {
  [PaymentProvider.Bovapay]: 30 * 60 * 1000, // 30 minutes
  [PaymentProvider.Test]: 30 * 60 * 1000, // 30 minutes
}
