import { useLayoutEffect } from 'react'
import { env } from '../../shared/env'

export const TelegramRedirectPageView = () => {
  useLayoutEffect(() => {
    const tgAuthResult = location.hash.replace('#tgAuthResult=', '')
    const query = new URLSearchParams(location.search)
    query.set('tgAuthResult', tgAuthResult)
    const redirectUrl = `${env.gamesApi.url}/trpc/auth.callbacks.telegram?${query}`
    location.replace(redirectUrl)
  }, [])

  return null
}
