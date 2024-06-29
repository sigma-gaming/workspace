import { createMutation, createQuery, Mutation, update } from '@farfetched/core'
import {
  BadRequestException,
  exceptionFilter,
  notExceptionFilter,
} from '@core/exceptions'
import { createApiEffect } from '@core/hono-client'
import { notifications } from '@mantine/notifications'
import { createEffect, createEvent, sample } from 'effector'
import { and, previous } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { $$notifications } from '../notifications'

const balanceQuery = createQuery({
  name: 'balance/get',
  effect: createApiEffect(gamesApi.me.getDetailedBalance.$get),
})

const depositMutation = createMutation({
  name: 'balance/deposit',
  effect: createApiEffect(gamesApi.balance.deposit.$post),
})

const withdrawMutation = createMutation({
  name: 'balance/withdraw',
  effect: createApiEffect(gamesApi.balance.withdraw.$post),
})

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => number,
) {
  update(balanceQuery, {
    on: mutation,
    by: {
      success: ({ query, mutation }) => {
        if (query && 'error' in query) return { error: query.error }

        const available = selector(mutation.result)
        return { result: { ...query?.result, available } }
      },
    },
  })
}

receiveUpdates(depositMutation, (data) => data.updatedBalance)
receiveUpdates(withdrawMutation, (data) => data.updatedBalance)

const request = createEvent()
const refresh = createEvent()
const deposit = createEvent()
const withdraw = createEvent()
const loaded = balanceQuery.finished.success
const settled = balanceQuery.finished.finally

const $balance = balanceQuery.$data
const $loading = balanceQuery.$pending
const $loaded = and($balance)
const $depositing = depositMutation.$pending
const $withdrawing = withdrawMutation.$pending

const $available = $balance.map((balance) => balance?.available ?? 0)
const $previousAvailable = previous($available)

sample({
  clock: request,
  target: balanceQuery.start,
})

sample({
  clock: refresh,
  fn: () => true,
  target: [balanceQuery.$stale, balanceQuery.refresh],
})

sample({
  clock: deposit,
  target: depositMutation.start,
})

sample({
  clock: withdraw,
  target: withdrawMutation.start,
})

sample({
  clock: depositMutation.finished.success,
  target: createEffect(() => {
    notifications.show({
      color: 'green',
      title: 'Баланс обновлен',
      message: `Деньги зачислены на ваш счёт`,
    })
  }),
})

sample({
  clock: withdrawMutation.finished.success,
  target: createEffect(() => {
    notifications.show({
      color: 'green',
      title: 'Баланс обновлен',
      message: `Деньги успешно выведены`,
    })
  }),
})

const receivedException = sample({
  source: withdrawMutation.finished.failure,
  fn: ({ error }) => error,
})

sample({
  source: receivedException,
  filter: exceptionFilter<BadRequestException>(BadRequestException),
  fn: (exception) =>
    $$notifications.options({
      color: 'red',
      title: 'Произошла ошибка',
      message: exception.payload.message,
    }),
  target: $$notifications.show,
})

sample({
  source: receivedException,
  filter: notExceptionFilter(BadRequestException),
  fn: () =>
    $$notifications.options({
      color: 'red',
      title: 'Что-то пошло не так',
      message: 'Попробуйте снова через пару минут',
    }),
  target: $$notifications.show,
})

export const $$balance = {
  receiveUpdates,
  request,
  refresh,
  deposit,
  withdraw,
  loaded,
  settled,
  $balance,
  $loading,
  $loaded,
  $available,
  $previousAvailable,
  $depositing,
  $withdrawing,
}
