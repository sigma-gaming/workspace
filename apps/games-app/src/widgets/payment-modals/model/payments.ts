import { createField, createForm } from '@core/forms'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { sample } from 'effector'
import { z } from 'zod'
import { createApiEffect } from '../../../shared/api/effects'
import { gamesApi } from '../../../shared/api/games'

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
export const depositFields = {
  ...fields,
  method: createField<DepositMethod>({
    emptyValue: DepositMethod.SBP,
  }),
}

export const depositForm = createForm({
  fields: depositFields,
  schema: z.object({
    amount: z.number().min(1),
    provider: z.nativeEnum(PaymentProvider),
    method: z.nativeEnum(DepositMethod),
    currency: z.nativeEnum(Currency),
  }),
})

export const depositMutation = createMutation({
  name: 'payments/deposit',
  effect: createApiEffect('json', gamesApi.payments.deposit.$post),
})

// Withdraw form
export const withdrawFields = {
  ...fields,
  method: createField<WithdrawalMethod>({
    emptyValue: WithdrawalMethod.SBP,
  }),
}

export const withdrawForm = createForm({
  fields: withdrawFields,
  schema: z.object({
    amount: z.number().min(1),
    provider: z.nativeEnum(PaymentProvider),
    method: z.nativeEnum(WithdrawalMethod),
    currency: z.nativeEnum(Currency),
  }),
})

export const withdrawMutation = createMutation({
  name: 'payments/withdraw',
  effect: createApiEffect('json', gamesApi.payments.withdraw.$post),
})

sample({
  clock: depositForm.submitted,
  target: depositMutation.start,
})

sample({
  clock: withdrawForm.submitted,
  target: withdrawMutation.start,
})
