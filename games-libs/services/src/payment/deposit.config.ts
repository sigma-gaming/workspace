import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'

export type DepositConfig = {
  [method in DepositMethod]: {
    providers: PaymentProvider[]
    currencies: Currency[]
  }
}
