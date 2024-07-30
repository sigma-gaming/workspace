import { useEffect, useMemo, useState } from 'react'
import { Breakpoint, Screen, screens } from '../../screens'

type Options = {
  from?: Breakpoint
  to?: Breakpoint
}

export function useMedia({ from, to }: Options) {
  const query = useMemo(() => {
    const queryComponents: string[] = []

    if (from) {
      const screen = screens.find((screen) => screen.name === from)!
      queryComponents.push(`(min-width: ${screen.width}px)`)
    }

    if (to) {
      const index = screens.findIndex((screen) => screen.name === to)
      const nextScreen = screens[index + 1] as Screen | undefined

      if (nextScreen) {
        queryComponents.push(`(max-width: ${nextScreen.width - 1}px)`)
      }
    }

    return queryComponents.join(' and ')
  }, [from, to])

  const [match, setMatch] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const handler = () => {
      const { matches } = window.matchMedia(query)
      setMatch(matches)
    }

    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [query])

  return match
}
