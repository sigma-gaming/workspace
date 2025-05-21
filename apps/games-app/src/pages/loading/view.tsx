import { Loader } from '@mantine/core'
import { MutableRefObject, useEffect, useRef } from 'react'
import { CenteredLayout } from '../../layouts/centered'
import { checkRedirectUrl } from '../../widgets/payment-modal'

function runChecks(
  checks: Array<() => boolean>,
  mountedRef: MutableRefObject<boolean>,
) {
  if (!mountedRef.current) return

  for (const check of checks) {
    if (check()) return
  }

  setTimeout(() => runChecks(checks, mountedRef), 100)
}

export const LoadingPageView = () => {
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    runChecks([checkRedirectUrl], mountedRef)

    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <CenteredLayout>
      <div className="flex flex-col items-center gap-4 max-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <h1 className="text-2xl font-medium text-center">Загрузка...</h1>
        </div>
      </div>
    </CenteredLayout>
  )
}
