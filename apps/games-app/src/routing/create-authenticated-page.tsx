import { useUnit } from 'effector-react'
import { useLayoutEffect } from 'react'
import { $$session } from '../entities/session/index.ts'
import { games } from './routes.ts'
import { RouteRecord } from './types.ts'

export function createAuthenticatedPage({
  view: View,
  ...rest
}: RouteRecord): RouteRecord {
  const AuthenticatedView = () => {
    const loggedIn = useUnit($$session.$loggedIn)

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
