import { createStatus } from '@core/client'
import { createField, createForm } from '@core/forms'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { gemInt, PaymentConfigLists } from '@games/model'
import { combine, createEvent, createStore, sample } from 'effector'
import { condition, debug } from 'patronum'
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

export const depositMutation = createMutation({
  name: 'payments/deposit',
  effect: createApiEffect('json', gamesApi.payments.deposit.$post),
})

export const withdrawMutation = createMutation({
  name: 'payments/withdraw',
  effect: createApiEffect('json', gamesApi.payments.withdraw.$post),
})

export const operationChanged = createEvent<Operation>()
export const refreshCorrectionAmount = createEvent()
export const amountCorrectionRequested = createEvent()
export const amountCorrectionRefreshed = createEvent<number>()

export const { $succeeded: $configLoaded } = createStatus(getConfigFx)

export const $operation = createStore<Operation>('deposit')
  .on(operationChanged, (_, operation) => operation)
  .reset(destroy)

const $config = createStore<PaymentConfigLists | null>(null)
  .on(getConfigFx.doneData, (_, lists) => lists)
  .reset(destroy)

const INITIAL_AMOUNT = gemInt(1000)

export const $correctedAmount = createStore(correctAmount(INITIAL_AMOUNT))
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

export const $methods = combine(
  $config,
  $operation,
  (lists, operation) => lists?.[operation] ?? [],
)

export const $currencies = combine(
  $methods,
  fields.method.$value,
  (methods, method) => {
    if (!method) return []
    if (methods.length === 0) return []
    const methodConfig = methods.find((c) => c.method === method) ?? null
    return methodConfig?.currencies ?? []
  },
)

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

export const $totalAmount = combine(
  $operation,
  $providerConfig,
  $correctedAmount,
  (operation, providerConfig, correctedAmount) => {
    let commissionRate = 0

    if (providerConfig) {
      commissionRate = providerConfig.entry.commissionRate
    }

    if (operation === 'deposit') {
      return Math.round((correctedAmount * (1 + commissionRate)) / 100)
    }

    return Math.round((correctedAmount * (1 - commissionRate)) / 100)
  },
)

sample({
  clock: initialize,
  target: getConfigFx,
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
    const firstCurrency = currencies[0].currency
    return firstCurrency
  },
  target: fields.currency.update,
})

sample({
  clock: fields.currency.$value,
  source: $providers,
  fn: (providers) => {
    if (providers.length === 0) return null
    const firstProvider = providers[0].provider
    return firstProvider
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
  target: [fields.amount.update, amountCorrectionRefreshed],
})

sample({
  clock: refreshCorrectionAmount,
  source: fields.amount.$value,
  target: amountCorrectionRefreshed,
})

sample({
  clock: amountCorrectionRequested,
  source: {
    amount: fields.amount.$value,
    correctedFor: $amountCorrectedFor,
  },
  filter: ({ amount, correctedFor }) => amount !== correctedFor,
  fn: ({ amount }) => amount,
  target: amountCorrectionRefreshed,
})

sample({
  clock: amountCorrectionRefreshed,
  source: $operation,
  fn: (operation, amount) => {
    if (operation === 'withdrawal') return amount
    return correctAmount(amount)
  },
  target: $correctedAmount,
})

sample({
  source: amountCorrectionRefreshed,
  target: $amountCorrectedFor,
})

debug({
  $amount: fields.amount.$value,
  $correctedAmount,
  $totalAmount,
  amountCorrectionRefreshed,
  amountCorrectionRequested,
})

condition({
  source: form.submitted,
  if: $operation.map((operation) => operation === 'deposit'),
  then: depositMutation.start,
  else: withdrawMutation.start,
})

sample({
  clock: destroy,
  target: [form.reset],
})
