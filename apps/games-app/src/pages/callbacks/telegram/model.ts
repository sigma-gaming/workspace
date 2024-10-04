import { createApiEffect } from '@core/client'
import { invoke } from '@withease/factories'
import { $$socialAuthentication } from '../../../features/social-authentication'
import { routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

const authenticateFx = createApiEffect(
  'json',
  gamesApi.auth.providers.signInViaTelegram.$post,
)

invoke($$socialAuthentication.factory, {
  clock: routes.telegramCallback.opened,
  authenticate: async () => {
    const tgAuthResult = location.hash.replace('#tgAuthResult=', '')
    const { status } = await authenticateFx({ tgAuthResult })
    if (status !== 'success') throw new Error('Authentication failed')
  },
})
