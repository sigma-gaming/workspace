import { useEffect } from 'react'

export function usePageTitle(title?: string | null) {
  useEffect(() => {
    if (!title) return

    const previous = document.title
    document.title = `${title} | Sigma Games`

    return () => {
      document.title = previous
    }
  }, [title])
}
