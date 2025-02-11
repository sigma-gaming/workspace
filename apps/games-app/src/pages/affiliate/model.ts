import { $$notifications, handleExceptions } from '@core/client'
import { noop } from '@core/utils'
import { ReferrerBalanceSelect } from '@dbs/games-schema'
import { createMutation, createQuery } from '@farfetched/core'
import { createEvent, createStore, sample } from 'effector'
import { and, status } from 'patronum'
import { $$affiliate } from '../../entities/affiliate'
import { $$audio, Sound } from '../../entities/audio'
import { $$balance } from '../../entities/balance'
import { routes } from '../../routing'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'

const withdraw = createEvent()
const reset = createEvent()

const getBalanceFx = createApiEffect(
  'query',
  gamesApi.affiliate.getBalance.$get,
)

const getSettingsQuery = createQuery({
  name: 'affiliate/getSettings',
  effect: createApiEffect('query', gamesApi.affiliate.getSettings.$get),
})

const getCampaignsQuery = createQuery({
  name: 'affiliate/getCampaigns',
  effect: createApiEffect('query', gamesApi.affiliate.getCampaigns.$get),
})

const getLastTransactionsQuery = createQuery({
  name: 'affiliate/getLastTransactions',
  effect: createApiEffect('query', gamesApi.affiliate.getLastTransactions.$get),
})

const withdrawMutation = createMutation({
  name: 'affiliate/withdraw',
  effect: createApiEffect('json', gamesApi.affiliate.withdraw.$post),
})

$$balance.receiveUpdates(withdrawMutation, ({ balance }) => balance)

const $settings = getSettingsQuery.$data
const $settingsLoaded = getSettingsQuery.$succeeded
const $revShare = $settings.map((settings) => settings?.revShare ?? 0)

const $balanceDetailed = createStore<ReferrerBalanceSelect | null>(null)
  .on(getBalanceFx.doneData, (_, balance) => balance)
  .reset(reset)

const $balanceStatus = status(getBalanceFx).reset(reset)
const $balanceLoaded = $balanceStatus.map((status) => status === 'done')
const $balance = $balanceDetailed.map((balance) => balance?.available ?? 0)

const $campaigns = getCampaignsQuery.$data.map((data) => data?.campaigns ?? [])
const $campaignsLoaded = getCampaignsQuery.$succeeded
const $primaryCampaign = $campaigns.map((campaigns) => campaigns.at(0) ?? null)
const $campaignCode = $primaryCampaign.map((campaign) => campaign?.code ?? '')

const $campaignVisits = $primaryCampaign.map(
  (campaign) => campaign?.totalVisits ?? 0,
)
const $campaignSignups = $primaryCampaign.map(
  (campaign) => campaign?.totalSignups ?? 0,
)

const $lastTransactionsLoaded = getLastTransactionsQuery.$succeeded
const $lastTransactions = getLastTransactionsQuery.$data.map(
  (data) => data?.transactions ?? [],
)
const $previewPayout = getLastTransactionsQuery.$data.map(
  (data) => data?.totalAmount ?? 0,
)

const $withdrawing = withdrawMutation.$pending

sample({
  clock: [routes.affiliate.opened, $$affiliate.$isConnected],
  filter: and(routes.affiliate.$isOpened, $$affiliate.$isConnected),
  fn: noop,
  target: [
    getBalanceFx,
    getSettingsQuery.start,
    getCampaignsQuery.start,
    getLastTransactionsQuery.start,
  ],
})

sample({
  clock: withdraw,
  fn: noop,
  target: withdrawMutation.start,
})

sample({
  clock: withdrawMutation.finished.success,
  target: [
    $$notifications.show.prepend(() => ({
      color: 'green',
      title: 'Баланс обновлен',
      message: `Деньги переведены на основной счёт`,
    })),
    $$audio.play.prepend(() => Sound.TopUp),
  ],
})

sample({
  clock: withdrawMutation.finished.success,
  source: $balanceDetailed,
  filter: Boolean,
  fn: (balance, { result }) => ({
    ...balance,
    available: result.balance.data.available,
  }),
  target: $balanceDetailed,
})

sample({
  clock: routes.affiliate.closed,
  target: reset,
})

sample({
  clock: reset,
  target: [getSettingsQuery.reset, getCampaignsQuery.reset],
})

handleExceptions(withdrawMutation)

export const $$affiliatePage = {
  withdraw,
  $settings,
  $revShare,
  $balance,
  $campaigns,
  $primaryCampaign,
  $campaignCode,
  $campaignVisits,
  $campaignSignups,
  $settingsLoaded,
  $balanceLoaded,
  $campaignsLoaded,
  $withdrawing,
  $lastTransactions,
  $lastTransactionsLoaded,
  $previewPayout,
}
