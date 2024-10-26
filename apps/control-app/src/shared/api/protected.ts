import { protectedApiEffectFactory } from '@core/client'
import { $$session } from './session'

export const createProtectedApiEffect = protectedApiEffectFactory({
  $accessToken: $$session.$accessToken,
  $accessTokenExpiresAt: $$session.$sessionExpiresAt,
  refresh: () =>
    $$session.refreshTokenFx().then(({ accessToken }) => accessToken),
})
