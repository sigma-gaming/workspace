import { createApiEffectFactory } from '@core/client'
import { $$session } from './session'

export const createApiEffect = createApiEffectFactory({
  authentication: {
    condition: $$session.$sessionActive,
    token: $$session.$accessToken,
    tokenExpiresAt: $$session.$sessionExpiresAt,
    refresh: () =>
      $$session.refreshTokenFx().then(({ accessToken }) => accessToken),
  },
})
