import { createField, createForm } from '@core/forms'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { createEvent, createStore, sample } from 'effector'
import { z } from 'zod'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'

// Events
const initialize = createEvent()
const reset = createEvent()

// Shared fields
const fields = {
  amount: createField({
    emptyValue: '',
  }),
  provider: createField<PaymentProvider>({
    emptyValue: PaymentProvider.Bovapay,
  }),
  currency: createField<Currency>({
    emptyValue: Currency.RUB,
  }),
}

// Deposit form
const depositFields = {
  ...fields,
  method: createField<DepositMethod>({
    emptyValue: DepositMethod.SBP,
  }),
}

const depositForm = createForm({
  fields: depositFields,
  schema: z.object({
    amount: z.number().min(1),
    provider: z.nativeEnum(PaymentProvider),
    method: z.nativeEnum(DepositMethod),
    currency: z.nativeEnum(Currency),
  }),
})

const depositMutation = createMutation({
  name: 'payments/deposit',
  effect: createApiEffect('json', gamesApi.payments.deposit.$post),
})

// Withdraw form
const withdrawFields = {
  ...fields,
  method: createField<WithdrawalMethod>({
    emptyValue: WithdrawalMethod.SBP,
  }),
  accountDetails: createField({
    emptyValue: '',
  }),
}

const withdrawForm = createForm({
  fields: withdrawFields,
  schema: z.object({
    amount: z.number().min(1),
    provider: z.nativeEnum(PaymentProvider),
    method: z.nativeEnum(DepositMethod),
    currency: z.nativeEnum(Currency),
  }),
})

const withdrawMutation = createMutation({
  name: 'payments/withdraw',
  effect: createApiEffect('json', gamesApi.payments.withdraw.$post),
})

// Payment history
const getPaymentHistoryFx = createApiEffect(
  'query',
  gamesApi.payments.history.$get,
)

const $paymentHistory = createStore([]).reset(reset)
const $loadingHistory = getPaymentHistoryFx.pending

// Connect forms to mutations
sample({
  clock: depositForm.submitted,
  target: depositMutation.start,
})

sample({
  clock: withdrawForm.submitted,
  target: withdrawMutation.start,
})

// Load payment history on initialize
sample({
  clock: initialize,
  target: getPaymentHistoryFx,
})

sample({
  clock: getPaymentHistoryFx.doneData,
  target: $paymentHistory,
})

export const $$paymentsModal = {
  initialize,
  reset,
  deposit: {
    form: depositForm,
    fields: depositFields,
    $pending: depositMutation.$pending,
  },
  withdraw: {
    form: withdrawForm,
    fields: withdrawFields,
    $pending: withdrawMutation.$pending,
  },
  history: {
    $data: $paymentHistory,
    $loading: $loadingHistory,
  },
}
