import { useUnit } from 'effector-react/effector-react.mjs'
import { useLayoutEffect } from 'react'
import { $$user } from '../entities/user'
import { home } from './routes.ts'
import { RouteRecord } from './types.ts'

export function createAuthenticatedRoute({
  view: View,
  ...rest
}: RouteRecord): RouteRecord {
  const AuthenticatedView = () => {
    const expired = useUnit($$user.$expired)

    useLayoutEffect(() => {
      if (!expired) return
      void home.open()
    })

    if (expired) {
      return null
    }

    return <View />
  }

  return {
    ...rest,
    view: AuthenticatedView,
  }
}
