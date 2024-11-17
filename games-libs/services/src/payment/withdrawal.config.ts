import { Currency, PaymentProvider, WithdrawalMethod } from '@dbs/games-types'

export type WithdrawalConfig = {
  [method in WithdrawalMethod]: {
    providers: PaymentProvider[]
    currencies: Currency[]
  }
}
