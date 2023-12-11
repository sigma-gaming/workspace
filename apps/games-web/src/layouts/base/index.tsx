import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const BaseLayout = ({ children }: Props) => {
  return <main>{children}</main>
}
