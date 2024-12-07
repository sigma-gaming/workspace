import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'

export type ConfigList<Method extends string, Entry> = Array<{
  method: Method
  providers: Array<{
    provider: PaymentProvider
    currencies: Array<{
      currency: Currency
      entry: Entry
    }>
  }>
}>

export type CurrencyConfigTree<Entry> = {
  [currency in Currency]?: Entry
}

export type ProviderConfigTree<Entry> = {
  [provider in PaymentProvider]?: CurrencyConfigTree<Entry>
}

export type ConfigTree<Method extends string, Entry> = {
  [method in Method]?: ProviderConfigTree<Entry>
}

export type DepositConfigEntry = {
  minAmount: number
  maxAmount: number
  commissionRate: number
}

export type WithdrawalConfigEntry = {
  minAmount: number
  maxAmount: number
  commissionRate: number
}

export type DepositConfigList = ConfigList<DepositMethod, DepositConfigEntry>

export type WithdrawalConfigList = ConfigList<
  WithdrawalMethod,
  WithdrawalConfigEntry
>

export type DepositConfigTree = ConfigTree<DepositMethod, DepositConfigEntry>

export type WithdrawalConfigTree = ConfigTree<
  WithdrawalMethod,
  WithdrawalConfigEntry
>

export type PaymentConfigLists = {
  deposit: DepositConfigList
  withdrawal: WithdrawalConfigList
}

export type PaymentConfigTrees = {
  deposit: DepositConfigTree
  withdrawal: WithdrawalConfigTree
}

export function toConfigTree<Method extends string, Entry>(
  list: ConfigList<Method, Entry>,
): ConfigTree<Method, Entry> {
  return list.reduce(
    (acc, { method, providers }) => {
      acc[method] = providers.reduce((acc, { provider, currencies }) => {
        acc[provider] = currencies.reduce((acc, { currency, entry }) => {
          acc[currency] = entry
          return acc
        }, {} as CurrencyConfigTree<Entry>)

        return acc
      }, {} as ProviderConfigTree<Entry>)

      return acc
    },
    {} as ConfigTree<Method, Entry>,
  )
}
