import { useUnit } from 'effector-react'
import { useLayoutEffect } from 'react'
import { $$user } from '../entities/user'
import { games } from './routes.ts'
import { RouteRecord } from './types.ts'

export function createAuthenticatedPage({
  view: View,
  ...rest
}: RouteRecord): RouteRecord {
  const AuthenticatedView = () => {
    const loggedIn = useUnit($$user.$loggedIn)

    useLayoutEffect(() => {
      if (loggedIn) return
      void games.open()
    })

    if (!loggedIn) {
      return null
    }

    return <View />
  }

  return {
    ...rest,
    view: AuthenticatedView,
  }
}
