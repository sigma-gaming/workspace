import { createApiEffect } from '@libs/hono-client'
import { invoke } from '@withease/factories'
import { $$socialAuthentication } from '../../../features/social-authentication'
import { routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

const authenticateFx = createApiEffect(
  gamesApi.auth.providers.signInViaVk.$post,
)

invoke($$socialAuthentication.factory, {
  clock: routes.vkCallback.opened,
  authenticate: async () => {
    const [hash, payloadEncoded] = window.location.hash.split('&payload=')
    const returnPath = decodeURIComponent(hash.replace('#path=', ''))
    const payload = decodeURIComponent(payloadEncoded)
    const { status } = await authenticateFx({ payload })
    if (status !== 'success') throw new Error('Authentication failed')
    return { returnPath }
  },
})
