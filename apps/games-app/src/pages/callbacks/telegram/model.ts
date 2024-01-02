import { attach, createEffect, sample } from 'effector'
import { $$balance } from '../../../entities/balance'
import { $$user } from '../../../entities/user'
import { router, routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

const authenticateFx = createEffect(async () => {
  const tgAuthResult = location.hash.replace('#tgAuthResult=', '')
  const query = new URLSearchParams(location.search)
  const { status } = await gamesApi.auth.providers.telegram.mutate({
    tgAuthResult,
  })
  if (status !== 'success') throw new Error('Authentication failed')
  return { returnPath: query.get('path')! }
})

const redirectFx = attach({
  source: router.$history,
  effect(history, returnPath: string) {
    history.replace(returnPath)
  },
})

sample({
  clock: routes.telegramCallback.opened,
  target: authenticateFx,
})

sample({
  clock: authenticateFx.doneData,
  fn: () => false,
  target: $$user.$expired,
})

sample({
  clock: authenticateFx.doneData,
  fn: ({ returnPath }) => returnPath,
  target: [redirectFx, $$user.request, $$balance.request],
})
