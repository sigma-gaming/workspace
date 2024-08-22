import { createApiEffect } from '@core/client'
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
    const query = new URLSearchParams(location.search)
    const payloadEncoded = query.get('payload')
    if (!payloadEncoded) throw new Error('No VK payload found')
    const payload = decodeURIComponent(payloadEncoded)
    const { status } = await authenticateFx({ payload })
    if (status !== 'success') throw new Error('VK authentication failed')
  },
})
