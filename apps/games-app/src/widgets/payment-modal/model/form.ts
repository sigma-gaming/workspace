import { createStatus, handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { createMutation } from '@farfetched/core'
import { gemInt } from '@games/model'
import { combine, createEffect, createStore, sample } from 'effector'
import { and, condition, interval, or } from 'patronum'
import { z } from 'zod'
import {
  Currency,
  CurrencyExchangeRate,
  DepositFlow,
  DepositMethod,
  DepositMethodConfig,
  getPaymentsCurrencyRates,
  getPaymentsDepositMethods,
  getPaymentsWallets,
  getPaymentsWithdrawalMethods,
  PaymentProvider,
  postPaymentsDeposit,
  postPaymentsWallets,
  postPaymentsWithdrawal,
  UserWallet,
  WithdrawalMethod,
  WithdrawalMethodConfig,
} from '../../../shared/api/core'
import { createApiEffect } from '../../../shared/api/effects'
import { $operation, Operation } from './modal'
import { destroy, initialize } from './shared'
import { paymentCreated } from './status'

export function checkRedirectUrl() {
  const redirectUrl = localStorage.getItem('payment/redirect-url')
  if (!redirectUrl) return false
  localStorage.removeItem('payment/redirect-url')
  window.location.href = redirectUrl
  return true
}

const getDepositConfigsFx = createApiEffect(getPaymentsDepositMethods)
const getWithdrawalConfigsFx = createApiEffect(getPaymentsWithdrawalMethods)
const getWalletsFx = createApiEffect(getPaymentsWallets)
const getCurrencyRatesFx = createApiEffect(getPaymentsCurrencyRates)

export const createWalletMutation = createMutation({
  name: 'payments/createWallet',
  effect: createApiEffect(postPaymentsWallets),
})

export const depositMutation = createMutation({
  name: 'payments/deposit',
  effect: createApiEffect(postPaymentsDeposit),
})

export const withdrawMutation = createMutation({
  name: 'payments/withdraw',
  effect: createApiEffect(postPaymentsWithdrawal),
})

handleExceptions(createWalletMutation)
handleExceptions(depositMutation)
handleExceptions(withdrawMutation)

export const { $succeeded: $depositConfigsLoaded } =
  createStatus(getDepositConfigsFx)
export const { $succeeded: $withdrawalConfigsLoaded } = createStatus(
  getWithdrawalConfigsFx,
)

export const $creatingPayment = or(
  depositMutation.$pending,
  withdrawMutation.$pending,
)

const $depositConfigs = createStore<DepositMethodConfig[]>([])
  .on(getDepositConfigsFx.doneData, (_, lists) => lists)
  .reset(destroy)

const $withdrawalConfigs = createStore<WithdrawalMethodConfig[]>([])
  .on(getWithdrawalConfigsFx.doneData, (_, lists) => lists)
  .reset(destroy)

export const $wallets = createStore<UserWallet[]>([])
  .on(getWalletsFx.doneData, (_, wallets) => wallets)
  .on(createWalletMutation.finished.success, (wallets, { result: wallet }) => [
    ...wallets,
    wallet,
  ])
  .reset(destroy)

export const $exchangeRates = createStore<CurrencyExchangeRate[]>([
  { currency: Currency.Rub, gems: gemInt(1) },
])
  .on(getCurrencyRatesFx.doneData, (_, rates) => rates)
  .reset(destroy)

export const $exchangeRatesMap = $exchangeRates.map((rates) => {
  return rates.reduce(
    (acc, rate) => {
      acc[rate.currency] = rate.gems
      return acc
    },
    {} as Record<Currency, number>,
  )
})

export const fields = {
  gemAmount: createField({
    emptyValue: gemInt(1000),
  }),
  provider: createField<PaymentProvider | null>({
    emptyValue: null,
  }),
  currency: createField<Currency | null>({
    emptyValue: null,
  }),
  method: createField<DepositMethod | WithdrawalMethod | null>({
    emptyValue: null,
  }),
  flow: createField<DepositFlow | null>({
    emptyValue: null,
  }),
}

export const form = createForm({
  fields,
  schema: z.object({
    gemAmount: z.number().min(1),
    provider: z.nativeEnum(PaymentProvider),
    method: z.union([
      z.nativeEnum(DepositMethod),
      z.nativeEnum(WithdrawalMethod),
    ]),
    currency: z.nativeEnum(Currency),
  }),
})

export const $requiredFieldsFilled = and(
  fields.gemAmount.$value,
  fields.provider.$value,
  fields.currency.$value,
  fields.method.$value,
  or(
    $operation.map((operation) => operation === Operation.Withdrawal),
    fields.flow.$value,
  ),
)

type Filters = {
  [key in keyof DepositMethodConfig | keyof WithdrawalMethodConfig]?:
    | string
    | null
}

export const $filters = combine(
  fields.method.$value,
  fields.currency.$value,
  fields.provider.$value,
  fields.flow.$value,
  (method, currency, provider, flow): Filters => ({
    method,
    currency,
    provider,
    flow,
  }),
)

function pickFilters(filters: Filters, keys: Array<keyof Filters>) {
  const picked: Filters = {}
  let key: keyof Filters
  for (key in filters) {
    if (!keys.includes(key)) continue
    picked[key] = filters[key]
  }
  return picked
}

function filter(
  configs: Array<DepositMethodConfig | WithdrawalMethodConfig>,
  filters: Filters,
) {
  return configs.filter((config) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null) return true
      return config[key as keyof typeof config] === value
    })
  })
}

function unique<T>(array: Array<T>) {
  return Array.from(new Set(array))
}

export const $configs = combine(
  $operation,
  $depositConfigs,
  $withdrawalConfigs,
  (operation, depositConfigs, withdrawalConfigs) => {
    return operation === 'deposit' ? depositConfigs : withdrawalConfigs
  },
)

export const $methodOptions = $configs.map((configs) => {
  return unique(configs.map((config) => config.method))
})

export const $currencyOptions = combine(
  $configs,
  $filters,
  (configs, filters) => {
    return unique(
      filter(configs, pickFilters(filters, ['method'])).map(
        (config) => config.currency,
      ),
    )
  },
)

export const $providerOptions = combine(
  $configs,
  $filters,
  (configs, filters) => {
    return unique(
      filter(configs, pickFilters(filters, ['method', 'currency'])).map(
        (config) => config.provider,
      ),
    )
  },
)

export const $flowOptions = combine($configs, $filters, (configs, filters) => {
  return unique(
    filter(
      configs,
      pickFilters(filters, ['method', 'currency', 'provider']),
    ).map((config) => (config as DepositMethodConfig).flow),
  )
})

export const $filteredConfigs = combine(
  $configs,
  $filters,
  (configs, filters) => filter(configs, filters),
)

export const $selectedConfig = combine($filteredConfigs, (configs) => {
  if (configs.length !== 1) return null
  return configs[0]!
})

export const $exchangeRate = combine(
  fields.currency.$value,
  $exchangeRatesMap,
  (currency, exchangeRatesMap) => {
    if (!currency) return null
    return exchangeRatesMap[currency] ?? null
  },
)

export const $exchangeRateMissing = combine(
  fields.currency.$value,
  $exchangeRatesMap,
  (currency, exchangeRatesMap) => {
    if (!currency) return false
    return typeof exchangeRatesMap[currency] === 'undefined'
  },
)

export const $totalAmount = combine(
  $operation,
  $selectedConfig,
  $exchangeRate,
  fields.gemAmount.$value,
  (operation, config, exchangeRate, gemAmount) => {
    if (typeof exchangeRate !== 'number') {
      return 0
    }

    let commissionRate = 0

    if (config) {
      commissionRate = config.commissionRate / 10000
    }

    const currencyAmount = gemAmount / exchangeRate

    return operation === 'deposit'
      ? currencyAmount * (1 + commissionRate)
      : currencyAmount * (1 - commissionRate)
  },
)

sample({
  clock: initialize,
  target: [getDepositConfigsFx, getWithdrawalConfigsFx, getCurrencyRatesFx],
})

const { tick: exchangeRatesRequested } = interval({
  start: initialize,
  timeout: 30_000,
  stop: destroy,
  leading: true,
  trailing: false,
})

sample({
  clock: exchangeRatesRequested,
  target: getCurrencyRatesFx,
})

sample({
  clock: [$operation, getDepositConfigsFx.done, getWithdrawalConfigsFx.done],
  source: $methodOptions,
  fn: (options) => options[0] ?? null,
  target: fields.method.update,
})

sample({
  clock: fields.method.$value,
  source: $currencyOptions,
  fn: (options) => options[0] ?? null,
  target: fields.currency.update,
})

sample({
  clock: fields.currency.$value,
  source: $providerOptions,
  fn: (options) => options[0] ?? null,
  target: fields.provider.update,
})

sample({
  clock: fields.provider.$value,
  source: $flowOptions,
  fn: (options) => options[0] ?? null,
  target: fields.flow.update,
})

sample({
  clock: $selectedConfig,
  source: fields.gemAmount.$value,
  filter: Boolean,
  fn: (amount, config) => {
    if (!config) return amount
    if (amount === 0) return 0
    const { minAmount, maxAmount } = config
    return Math.min(maxAmount, Math.max(minAmount, amount))
  },
  target: fields.gemAmount.update,
})

sample({
  clock: fields.gemAmount.$value,
  source: $selectedConfig,
  filter: (config, gemAmount) => {
    if (!config) return false
    return gemAmount > config.maxAmount || gemAmount < config.minAmount
  },
  fn: (config, gemAmount) => {
    if (!config) return gemAmount
    return Math.min(config.maxAmount, Math.max(config.minAmount, gemAmount))
  },
  target: fields.gemAmount.update,
})

condition({
  source: form.submitted,
  if: $operation.map((operation) => operation === Operation.Deposit),
  then: depositMutation.start,
  else: withdrawMutation.start,
})

sample({
  clock: form.submitted,
  source: {
    config: $selectedConfig,
    operation: $operation,
  },
  filter: ({ config, operation }) => {
    if (operation !== Operation.Deposit) return false
    return (config as DepositMethodConfig).flow === DepositFlow.Redirect
  },
  target: createEffect(() => {
    window.open('/loading')
  }),
})

sample({
  clock: depositMutation.finished.success,
  fn: ({ result }) => result.id,
  target: paymentCreated,
})

sample({
  clock: depositMutation.finished.success,
  filter: ({ result }) => result.flow === DepositFlow.Redirect,
  fn: ({ result }) => {
    if (result.flowDetails.flow !== DepositFlow.Redirect)
      throw new Error('Invalid flow')
    return result.flowDetails.redirectUrl
  },
  target: createEffect((url: string) => {
    localStorage.setItem('payment/redirect-url', url)
  }),
})

sample({
  clock: withdrawMutation.finished.success,
  fn: ({ result }) => result.id,
  target: paymentCreated,
})

sample({
  clock: destroy,
  target: [form.reset],
})
