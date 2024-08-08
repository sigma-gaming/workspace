import * as Sentry from '@sentry/react'
import { Component, ReactElement, ReactNode, Suspense } from 'react'

class ErrorBoundary extends Component<
  {
    fallback: ReactNode
    children: ReactNode
    onFailure?: () => void
  },
  { hasError: boolean }
> {
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  state = { hasError: false }

  componentDidCatch(error: unknown) {
    const { onFailure } = this.props
    onFailure?.()
    Sentry.captureException(error)
  }

  render() {
    const { fallback, children } = this.props
    const { hasError } = this.state

    if (hasError) {
      return fallback
    }

    return children
  }
}

export const LazyWrapper = ({
  loadingFallback = null,
  failureFallback = null,
  children,
  onFailure,
}: {
  loadingFallback?: ReactNode
  failureFallback?: ReactNode
  children: ReactElement
  onFailure?: () => void
}) => {
  return (
    <ErrorBoundary fallback={failureFallback} onFailure={onFailure}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}
