import clsx from 'clsx'
import { PropsWithChildren } from 'react'

type Props = {
  className?: string
}

export const CenteredLayout = ({
  className,
  children,
}: PropsWithChildren<Props>) => {
  return (
    <div
      className={clsx(
        className,
        'flex items-center justify-center fixed inset-0 p-6',
      )}
    >
      {children}
    </div>
  )
}
