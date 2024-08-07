import {
  BadRequestException,
  exceptionFilter,
  notExceptionFilter,
} from '@core/exceptions'
import { createApiEffect } from '@core/hono-client'
import { subscriptionFactory } from '@core/io-client'
import { createMutation, Mutation } from '@farfetched/core'
import { BalanceDetailed } from '@games/model'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { previous, status } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'
import { $$audio, Sound } from '../audio'
import { $$notifications } from '../notifications'

const getDetailedBalanceFx = createApiEffect(
  gamesApi.me.getDetailedBalance.$get,
)

const depositMutation = createMutation({
  name: 'balance/deposit',
  effect: createApiEffect(gamesApi.balance.deposit.$post),
})

const withdrawMutation = createMutation({
  name: 'balance/withdraw',
  effect: createApiEffect(gamesApi.balance.withdraw.$post),
})

const { receivedData: balanceUpdated } = invoke(() =>
  subscriptionFactory({
    ws: gamesWs,
    event: 'balance/updated',
  }),
)

const request = createEvent()
const deposit = createEvent()
const withdraw = createEvent()
const loaded = createEvent()

const $balance = createStore<BalanceDetailed | null>(null)
const $status = status(getDetailedBalanceFx)

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => number,
) {
  sample({
    clock: mutation.finished.success,
    source: $balance,
    filter: Boolean,
    fn: (balance, { result }) => ({
      ...balance,
      available: selector(result),
    }),
    target: $balance,
  })
}

const $loading = $status.map((status) => status === 'pending')
const $loaded = $status.map((status) => status === 'done')
const $depositing = depositMutation.$pending
const $withdrawing = withdrawMutation.$pending

const $available = $balance.map((balance) => balance?.available ?? 0)
const $previousAvailable = previous($available)

sample({
  clock: request,
  target: getDetailedBalanceFx,
})

sample({
  clock: getDetailedBalanceFx.done,
  target: loaded,
})

sample({
  source: getDetailedBalanceFx.doneData,
  target: $balance,
})

receiveUpdates(depositMutation, (data) => data.updatedBalance)
receiveUpdates(withdrawMutation, (data) => data.updatedBalance)

sample({
  clock: balanceUpdated,
  target: $balance,
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
  target: [
    $$notifications.show.prepend(() => ({
      color: 'green',
      title: 'Баланс обновлен',
      message: `Деньги зачислены на ваш счёт`,
    })),
    $$audio.play.prepend(() => Sound.TopUp),
  ],
})

sample({
  clock: withdrawMutation.finished.success,
  target: [
    $$notifications.show.prepend(() => ({
      color: 'green',
      title: 'Баланс обновлен',
      message: `Деньги успешно выведены`,
    })),
    $$audio.play.prepend(() => Sound.Withdraw),
  ],
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
  deposit,
  withdraw,
  loaded,
  $balance,
  $loading,
  $loaded,
  $available,
  $previousAvailable,
  $depositing,
  $withdrawing,
}
