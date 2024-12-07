import { createStatus } from '@core/client'
import { createField, createForm } from '@core/forms'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { PaymentConfigLists } from '@games/model'
import { combine, createEvent, createStore, sample } from 'effector'
import { condition } from 'patronum'
import { z } from 'zod'
import { createApiEffect } from '../../../shared/api/effects'
import { gamesApi } from '../../../shared/api/games'
import { destroy, initialize } from './shared'

export type Operation = 'deposit' | 'withdrawal'

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

export const $operation = createStore<Operation>('deposit')
  .on(operationChanged, (_, operation) => operation)
  .reset(destroy)

const $config = createStore<PaymentConfigLists | null>(null)
  .on(getConfigFx.doneData, (_, lists) => lists)
  .reset(destroy)

export const { $succeeded: $configLoaded } = createStatus(getConfigFx)

// Deposit form
export const fields = {
  amount: createField({
    emptyValue: 0,
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

export const $providers = combine(
  $methods,
  fields.method.$value,
  (configList, method) => {
    if (!method) return null
    if (!configList) return null
    return configList.find((c) => c.method === method) ?? null
  },
)

export const $currencies = combine(
  $providers,
  fields.provider.$value,
  (methodConfig, provider) => {
    if (!methodConfig) return null
    if (methodConfig.providers.length === 0) return null
    return methodConfig.providers.find((c) => c.provider === provider) ?? null
  },
)

export const $currencyConfig = combine(
  $currencies,
  fields.currency.$value,
  (providerConfig, currency) => {
    if (!providerConfig) return null
    if (providerConfig.currencies.length === 0) return null
    return (
      providerConfig.currencies.find((c) => c.currency === currency) ?? null
    )
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
  source: $providers,
  fn: (methodConfig) => {
    if (!methodConfig) return null
    if (methodConfig.providers.length === 0) return null
    const firstProvider = methodConfig.providers[0].provider
    return firstProvider
  },
  target: fields.provider.update,
})

sample({
  clock: fields.provider.$value,
  source: $currencies,
  fn: (providerConfig) => {
    if (!providerConfig) return null
    if (providerConfig.currencies.length === 0) return null
    const firstCurrency = providerConfig.currencies[0].currency
    return firstCurrency
  },
  target: fields.currency.update,
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
