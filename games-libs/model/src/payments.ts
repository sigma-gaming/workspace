import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'

export type CurrencyExchangeRate = Record<Currency, number>

export type ConfigList<Method extends string, Entry> = Array<{
  method: Method
  currencies: Array<{
    currency: Currency
    only?: boolean
    providers: Array<{
      provider: PaymentProvider
      entry: Entry
    }>
  }>
}>

export type ProviderConfigTree<Entry> = {
  [provider in PaymentProvider]?: Entry
}

export type CurrencyConfigTree<Entry> = {
  [currency in Currency]?: ProviderConfigTree<Entry>
}

export type ConfigTree<Method extends string, Entry> = {
  [method in Method]?: CurrencyConfigTree<Entry>
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
    (acc, { method, currencies }) => {
      acc[method] = currencies.reduce((acc, { currency, providers }) => {
        acc[currency] = providers.reduce((acc, { provider, entry }) => {
          acc[provider] = entry
          return acc
        }, {} as ProviderConfigTree<Entry>)

        return acc
      }, {} as CurrencyConfigTree<Entry>)

      return acc
    },
    {} as ConfigTree<Method, Entry>,
  )
}
