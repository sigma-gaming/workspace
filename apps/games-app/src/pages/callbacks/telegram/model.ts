import { invoke } from '@withease/factories'
import { $$socialAuthentication } from '../../../features/social-authentication'
import { routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

invoke($$socialAuthentication.factory, {
  clock: routes.telegramCallback.opened,
  authenticate: async () => {
    const tgAuthResult = location.hash.replace('#tgAuthResult=', '')
    const query = new URLSearchParams(location.search)
    const { status } = await gamesApi.auth.providers.telegram.mutate({
      tgAuthResult,
    })
    if (status !== 'success') throw new Error('Authentication failed')
    return { returnPath: query.get('path')! }
  },
})
