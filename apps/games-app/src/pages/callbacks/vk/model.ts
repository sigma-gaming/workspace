import { attach, createEffect, sample } from 'effector'
import { $$balance } from '../../../entities/balance'
import { $$user } from '../../../entities/user'
import { router, routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

const authenticateFx = createEffect(async () => {
  const [hash, payloadEncoded] = window.location.hash.split('&payload=')
  const returnPath = decodeURIComponent(hash.replace('#path=', ''))
  const payload = decodeURIComponent(payloadEncoded)
  const { status } = await gamesApi.auth.providers.vk.mutate({ payload })
  if (status !== 'success') throw new Error('Authentication failed')
  return { returnPath }
})

const redirectFx = attach({
  source: router.$history,
  effect(history, returnPath: string) {
    history.replace(returnPath)
  },
})

sample({
  clock: routes.vkCallback.opened,
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
