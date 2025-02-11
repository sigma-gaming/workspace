import {
  $$notifications,
  handleExceptions,
  onlyLatestUpdate,
} from '@core/client'
import { createField, createForm } from '@core/forms'
import { subscriptionFactory } from '@core/io-client'
import { noop } from '@core/utils'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { createMutation, createQuery } from '@farfetched/core'
import { formatGem, gemFloat, GlobalTaskStatusUpdate } from '@games/model'
import { invoke } from '@withease/factories'
import { createEvent, createStore, EffectResult, sample } from 'effector'
import { status } from 'patronum'
import { z } from 'zod'
import { $$audio, Sound } from '../../entities/audio'
import { $$balance } from '../../entities/balance'
import { $$session } from '../../entities/session'
import { routes } from '../../routing'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const completeGlobalTask = createEvent<GlobalTaskKey>()
const claimGlobalTaskReward = createEvent<GlobalTaskKey>()
const reset = createEvent()

const applyPromocodeMutation = createMutation({
  name: 'bonuses/applyPromocode',
  effect: createApiEffect('json', gamesApi.promocodes.apply.$post),
})

const getGlobalTasksQuery = createQuery({
  name: 'bonuses/getGlobalTasks',
  effect: createApiEffect('query', gamesApi.tasks.global.getTasks.$get),
})

const getGlobalTaskStatusesFx = createApiEffect(
  'query',
  gamesApi.tasks.global.getStatuses.$get,
)

export type GlobalTaskStatuses = EffectResult<typeof getGlobalTaskStatusesFx>

const INITIAL_GLOBAL_TASK_STATUSES: GlobalTaskStatuses = {
  [GlobalTaskKey.TelegramGroupSubscribe]: TaskStatus.Pending,
  [GlobalTaskKey.VkGroupSubscribe]: TaskStatus.Pending,
  [GlobalTaskKey.VkPinnedRepost]: TaskStatus.Pending,
}

const completeGlobalTaskMutation = createMutation({
  name: 'bonuses/completeGlobalTask',
  effect: createApiEffect('json', gamesApi.tasks.global.complete.$post),
})

const claimGlobalTaskRewardMutation = createMutation({
  name: 'bonuses/claimGlobalTaskReward',
  effect: createApiEffect('json', gamesApi.tasks.global.claimReward.$post),
})

const globalTaskStatusUpdateReceived = createEvent<GlobalTaskStatusUpdate>()

const { receivedData: globalTaskStatusUpdated } = invoke(() =>
  subscriptionFactory({
    ws: gamesWs,
    event: 'global-tasks/status-updated',
  }),
)

const promocodeFields = {
  code: createField({
    emptyValue: '',
  }),
}

const promocodeForm = createForm({
  fields: promocodeFields,
  schema: z.object({
    code: z.string().min(1, 'Не может быть пустым'),
  }),
})

handleExceptions(applyPromocodeMutation, { form: promocodeForm })
handleExceptions(completeGlobalTaskMutation)
handleExceptions(claimGlobalTaskRewardMutation)

$$balance.receiveUpdates(applyPromocodeMutation, ({ balance }) => balance)
$$balance.receiveUpdates(
  claimGlobalTaskRewardMutation,
  ({ balance }) => balance,
)

const $globalTasks = getGlobalTasksQuery.$data
const $globalTasksLoading = getGlobalTasksQuery.$pending
const $globalTaskStatuses = createStore<GlobalTaskStatuses>(
  INITIAL_GLOBAL_TASK_STATUSES,
)
const $globalTaskStatusesLoaded = status(getGlobalTaskStatusesFx).map(
  (status) => status === 'done',
)
const $applyingPromocode = applyPromocodeMutation.$pending

const INITIAL_LOADING = Object.values(GlobalTaskKey).reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as Record<GlobalTaskKey, boolean>,
)

const $completingGlobalTaskMap = createStore(INITIAL_LOADING)
  .on(completeGlobalTaskMutation.started, (map, { params }) => ({
    ...map,
    [params.taskKey]: true,
  }))
  .on(completeGlobalTaskMutation.finished.finally, (map, { params }) => ({
    ...map,
    [params.taskKey]: false,
  }))

const $claimingGlobalTaskRewardMap = createStore(INITIAL_LOADING)
  .on(claimGlobalTaskRewardMutation.started, (map, { params }) => ({
    ...map,
    [params.taskKey]: true,
  }))
  .on(claimGlobalTaskRewardMutation.finished.finally, (map, { params }) => ({
    ...map,
    [params.taskKey]: false,
  }))

sample({
  source: getGlobalTaskStatusesFx.doneData,
  target: $globalTaskStatuses,
})

sample({
  source: promocodeForm.submitted,
  target: applyPromocodeMutation.start,
})

sample({
  clock: applyPromocodeMutation.finished.success,
  fn: ({ result }) =>
    $$notifications.options({
      color: 'green',
      title: 'Промокод активирован',
      message: `Баланс пополнен на ${formatGem(gemFloat(result.payout))}g`,
    }),
  target: $$notifications.show,
})

sample({
  clock: [
    applyPromocodeMutation.finished.success,
    claimGlobalTaskRewardMutation.finished.success,
  ],
  target: $$audio.play.prepend(() => Sound.TopUp),
})

sample({
  clock: [completeGlobalTaskMutation.finished.success],
  target: [
    $$audio.play.prepend(() => Sound.WinBigDefault),
    $$notifications.show.prepend(() => ({
      color: 'green',
      title: 'Задание выполнено',
      message: 'Теперь вы можете забрать награду',
    })),
  ],
})

sample({
  clock: completeGlobalTask,
  fn: (taskKey) => ({ taskKey }),
  target: completeGlobalTaskMutation.start,
})

sample({
  clock: [
    completeGlobalTaskMutation.finished.success,
    claimGlobalTaskRewardMutation.finished.success,
  ],
  fn: ({ result }) => result.task,
  target: globalTaskStatusUpdateReceived,
})

sample({
  source: globalTaskStatusUpdated,
  target: globalTaskStatusUpdateReceived,
})

sample({
  clock: onlyLatestUpdate(globalTaskStatusUpdateReceived),
  source: $globalTaskStatuses,
  fn: (statuses, { data }) => ({ ...statuses, [data.key]: data.status }),
  target: $globalTaskStatuses,
})

sample({
  clock: claimGlobalTaskReward,
  fn: (taskKey) => ({ taskKey }),
  target: claimGlobalTaskRewardMutation.start,
})

sample({
  clock: routes.bonuses.opened,
  fn: noop,
  target: [getGlobalTasksQuery.refresh],
})

sample({
  clock: routes.bonuses.opened,
  filter: $$session.$loggedIn,
  fn: noop,
  target: [getGlobalTaskStatusesFx],
})

sample({
  clock: routes.bonuses.closed,
  target: reset,
})

sample({
  clock: reset,
  target: [promocodeForm.reset, $globalTaskStatuses.reinit],
})

export const $$bonusesPage = {
  promocodeFields,
  promocodeForm,
  $applyingPromocode,
  $globalTaskStatuses,
  $globalTaskStatusesLoaded,
  $completingGlobalTaskMap,
  $claimingGlobalTaskRewardMap,
  $globalTasks,
  $globalTasksLoading,
  completeGlobalTask,
  claimGlobalTaskReward,
}
