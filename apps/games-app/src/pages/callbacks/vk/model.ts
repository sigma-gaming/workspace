import { invoke } from '@withease/factories'
import { $$socialAuthentication } from '../../../features/social-authentication'
import { routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

invoke($$socialAuthentication.factory, {
  clock: routes.vkCallback.opened,
  authenticate: async () => {
    const [hash, payloadEncoded] = window.location.hash.split('&payload=')
    const returnPath = decodeURIComponent(hash.replace('#path=', ''))
    const payload = decodeURIComponent(payloadEncoded)
    const { status } = await gamesApi.auth.providers.vk.mutate({ payload })
    if (status !== 'success') throw new Error('Authentication failed')
    return { returnPath }
  },
})
