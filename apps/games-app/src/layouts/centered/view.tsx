import { PropsWithChildren } from 'react'

export const CenteredLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex items-center justify-center fixed inset-0 p-6">{children}</div>
  )
}
