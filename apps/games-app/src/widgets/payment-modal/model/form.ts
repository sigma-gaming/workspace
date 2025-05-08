import { createStatus, handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { createMutation } from '@farfetched/core'
import { gemInt } from '@games/model'
import { combine, createEvent, createStore, sample } from 'effector'
import { and, condition, interval } from 'patronum'
import { z } from 'zod'
import {
  Currency,
  CurrencyExchangeRates,
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
import { destroy, initialize } from './shared'

export type Operation = 'deposit' | 'withdrawal'

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

export const operationChanged = createEvent<Operation>()
export const refreshCorrectionAmount = createEvent()
export const amountCorrectionRefreshed = createEvent<number>()

export const { $succeeded: $depositConfigsLoaded } =
  createStatus(getDepositConfigsFx)
export const { $succeeded: $withdrawalConfigsLoaded } = createStatus(
  getWithdrawalConfigsFx,
)

export const $operation = createStore<Operation>('deposit')
  .on(operationChanged, (_, operation) => operation)
  .reset(destroy)

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

export const $exchangeRates = createStore<CurrencyExchangeRates | null>({
  map: {
    [Currency.Rub]: gemInt(1),
  },
})
  .on(getCurrencyRatesFx.doneData, (_, rates) => rates)
  .reset(destroy)

const INITIAL_AMOUNT = gemInt(1000)
export const $correctedAmount = createStore(INITIAL_AMOUNT)
export const $amountCorrectedFor = createStore(INITIAL_AMOUNT)

export const fields = {
  gemAmount: createField({
    emptyValue: INITIAL_AMOUNT,
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
)

export const $methods = combine(
  $depositConfigs,
  $withdrawalConfigs,
  $operation,
  (depositMethods, withdrawalMethods, operation) => {
    const configs = operation === 'deposit' ? depositMethods : withdrawalMethods
    return Array.from(new Set(configs.map((c) => c.method)))
  },
)

export const $methodConfigs = combine(
  $depositConfigs,
  $withdrawalConfigs,
  $operation,
  $methods,
  fields.method.$value,
  (depositConfigs, withdrawalConfigs, operation, methods, method) => {
    if (!method) return []
    if (methods.length === 0) return []
    const configs = operation === 'deposit' ? depositConfigs : withdrawalConfigs
    return configs.filter((c) => c.method === method)
  },
)

export const $currencies = $methodConfigs.map((methodConfigs) => {
  const all = methodConfigs.map((c) => c.currency)
  return Array.from(new Set(all))
})

export const $currencyConfigs = combine(
  $methodConfigs,
  fields.currency.$value,
  (methodConfigs, currency) => {
    if (!currency) return []
    return methodConfigs.filter((c) => c.currency === currency)
  },
)

export const $providers = combine(
  $methodConfigs,
  fields.currency.$value,
  (methodConfigs, currency) => {
    if (!currency) return []
    return methodConfigs
      .filter((c) => c.currency === currency)
      .map((c) => c.provider)
  },
)

export const $selectedConfig = combine(
  $methodConfigs,
  fields.currency.$value,
  fields.provider.$value,
  (methodConfigs, currency, provider) => {
    if (!currency) return null
    if (!provider) return null

    const config = methodConfigs.find(
      (c) => c.currency === currency && c.provider === provider,
    )

    return config ?? null
  },
)

export const $exchangeRate = combine(
  fields.currency.$value,
  $exchangeRates,
  (currency, exchangeRates) => {
    if (!currency) return null
    if (!exchangeRates) return null
    return exchangeRates.map[currency] ?? null
  },
)

export const $exchangeRateMissing = combine(
  fields.currency.$value,
  $exchangeRates,
  (currency, exchangeRates) => {
    if (!currency) return false
    if (!exchangeRates) return false
    return typeof exchangeRates.map[currency] === 'undefined'
  },
)

export const $totalAmount = combine(
  $operation,
  $selectedConfig,
  $exchangeRate,
  $correctedAmount,
  (operation, config, exchangeRate, correctedAmount) => {
    if (typeof exchangeRate !== 'number') {
      return 0
    }

    let commissionRate = 0

    if (config) {
      commissionRate = config.commissionRate
    }

    const currencyAmount = correctedAmount / exchangeRate

    return Math.round(
      operation === 'deposit'
        ? currencyAmount * (1 + commissionRate)
        : currencyAmount * (1 - commissionRate),
    )
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
  clock: $operation,
  target: fields.method.reset,
})

sample({
  clock: fields.method.$value,
  source: $methodConfigs,
  fn: (configs) => {
    if (configs.length === 0) return null
    return configs[0]?.currency ?? null
  },
  target: fields.currency.update,
})

sample({
  clock: fields.currency.$value,
  source: $currencyConfigs,
  fn: (configs) => {
    if (configs.length === 0) return null
    return configs[0]?.provider ?? null
  },
  target: fields.provider.update,
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
