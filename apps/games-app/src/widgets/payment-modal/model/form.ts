import { createStatus, handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { CurrencyExchangeRates, gemInt, PaymentConfigLists } from '@games/model'
import { combine, createEvent, createStore, sample } from 'effector'
import { and, condition, interval } from 'patronum'
import { z } from 'zod'
import { createApiEffect } from '../../../shared/api/effects'
import { gamesApi } from '../../../shared/api/games'
import { destroy, initialize } from './shared'

export type Operation = 'deposit' | 'withdrawal'

function correctAmount(amount: number) {
  const correction = Math.floor(Math.random() * 50) + 1
  return amount + gemInt(correction)
}

const getConfigFx = createApiEffect('query', gamesApi.payments.getConfig.$get)
const getCurrencyRatesFx = createApiEffect(
  'query',
  gamesApi.payments.getCurrencyRates.$get,
)

export const depositMutation = createMutation({
  name: 'payments/deposit',
  effect: createApiEffect('json', gamesApi.payments.deposit.$post),
})

gamesApi.payments.getConfig.$get().then((response) => {
  if (!response.ok && response.status === 400) {
    console.log('Node is better than bun')
  }
})

export const withdrawMutation = createMutation({
  name: 'payments/withdraw',
  effect: createApiEffect('json', gamesApi.payments.withdraw.$post),
})

handleExceptions(depositMutation)
handleExceptions(withdrawMutation)

export const operationChanged = createEvent<Operation>()
export const refreshCorrectionAmount = createEvent()
export const amountCorrectionRefreshed = createEvent<number>()

export const { $succeeded: $configLoaded } = createStatus(getConfigFx)

export const $operation = createStore<Operation>('deposit')
  .on(operationChanged, (_, operation) => operation)
  .reset(destroy)

const $config = createStore<PaymentConfigLists | null>(null)
  .on(getConfigFx.doneData, (_, lists) => lists)
  .reset(destroy)

export const $exchangeRates = createStore<CurrencyExchangeRates | null>({
  [Currency.RUB]: gemInt(1),
})
  .on(getCurrencyRatesFx.doneData, (_, rates) => rates)
  .reset(destroy)

const INITIAL_AMOUNT = gemInt(1000)
export const $correctedAmount = createStore(INITIAL_AMOUNT)
export const $amountCorrectedFor = createStore(INITIAL_AMOUNT)

// Deposit form
export const fields = {
  amount: createField({
    emptyValue: INITIAL_AMOUNT,
  }),
  provider: createField<PaymentProvider | null>({
    emptyValue: null,
  }),
  currency: createField<Currency | null>({
    emptyValue: null,
  }),
  method: createField<DepositMethod | null>({
    emptyValue: null,
  }),
}

export const form = createForm({
  fields,
  schema: z.object({
    amount: z.number().min(1),
    provider: z.nativeEnum(PaymentProvider),
    method: z.union([
      z.nativeEnum(DepositMethod),
      z.nativeEnum(WithdrawalMethod),
    ]),
    currency: z.nativeEnum(Currency),
  }),
})

export const $requiredFieldsFilled = and(
  fields.amount.$value,
  fields.provider.$value,
  fields.currency.$value,
  fields.method.$value,
)

export const $methods = combine(
  $config,
  $operation,
  (lists, operation) => lists?.[operation] ?? [],
)

export const $methodConfig = combine(
  $methods,
  fields.method.$value,
  (methods, method) => {
    if (!method) return null
    if (methods.length === 0) return null
    return methods.find((c) => c.method === method) ?? null
  },
)

export const $isP2pMethod = $methodConfig.map((methodConfig) => {
  return Boolean(methodConfig?.isP2p)
})

export const $currencies = $methodConfig.map((methodConfig) => {
  return methodConfig?.currencies ?? []
})

export const $currencyConfig = combine(
  $currencies,
  fields.currency.$value,
  (currencies, currency) => {
    if (!currency) return null
    if (currencies.length === 0) return null
    return currencies.find((c) => c.currency === currency) ?? null
  },
)

export const $providers = $currencyConfig.map((currencyConfig) => {
  return currencyConfig?.providers ?? []
})

export const $providerConfig = combine(
  $providers,
  fields.provider.$value,
  (providers, provider) => {
    if (!provider) return null
    if (providers.length === 0) return null
    return providers.find((c) => c.provider === provider) ?? null
  },
)

export const $exchangeRate = combine(
  fields.currency.$value,
  $exchangeRates,
  (currency, exchangeRates) => {
    if (!currency) return null
    if (!exchangeRates) return null
    return exchangeRates[currency] ?? null
  },
)

export const $exchangeRateMissing = combine(
  fields.currency.$value,
  $exchangeRates,
  (currency, exchangeRates) => {
    if (!currency) return false
    if (!exchangeRates) return false
    return typeof exchangeRates[currency] === 'undefined'
  },
)

export const $totalAmount = combine(
  $operation,
  $providerConfig,
  $exchangeRate,
  $correctedAmount,
  (operation, providerConfig, exchangeRate, correctedAmount) => {
    if (typeof exchangeRate !== 'number') {
      return 0
    }

    let commissionRate = 0

    if (providerConfig) {
      commissionRate = providerConfig.entry.commissionRate
    }

    const gemsAmount =
      operation === 'deposit'
        ? Math.round(correctedAmount * (1 + commissionRate))
        : Math.round(correctedAmount * (1 - commissionRate))

    return gemsAmount / exchangeRate
  },
)

sample({
  clock: initialize,
  target: getConfigFx,
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
  clock: $operation,
  target: fields.method.reset,
})

sample({
  clock: fields.method.$value,
  source: $currencies,
  fn: (currencies) => {
    if (currencies.length === 0) return null
    return currencies[0]?.currency ?? null
  },
  target: fields.currency.update,
})

sample({
  clock: fields.currency.$value,
  source: $providers,
  fn: (providers) => {
    if (providers.length === 0) return null
    return providers[0]?.provider ?? null
  },
  target: fields.provider.update,
})

sample({
  clock: $providerConfig,
  source: fields.amount.$value,
  filter: Boolean,
  fn: (amount, config) => {
    if (!config) return amount
    if (amount === 0) return 0
    const { minAmount, maxAmount } = config.entry
    return Math.min(maxAmount, Math.max(minAmount, amount))
  },
  target: fields.amount.update,
})

sample({
  clock: [$isP2pMethod, fields.amount.$value, refreshCorrectionAmount],
  source: fields.amount.$value,
  target: amountCorrectionRefreshed,
})

sample({
  clock: amountCorrectionRefreshed,
  source: $isP2pMethod,
  fn: (isP2pMethod, amount) => {
    if (!isP2pMethod) return amount
    return correctAmount(amount)
  },
  target: $correctedAmount,
})

sample({
  source: amountCorrectionRefreshed,
  target: $amountCorrectedFor,
})

const finalValuesSubmitted = sample({
  clock: form.submitted,
  source: $correctedAmount,
  fn: (amount, values) => ({ ...values, amount }),
})

condition({
  source: finalValuesSubmitted,
  if: $operation.map((operation) => operation === 'deposit'),
  then: depositMutation.start,
  else: withdrawMutation.start,
})

sample({
  clock: destroy,
  target: [form.reset],
})
