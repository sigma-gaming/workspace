import { Title } from '@mantine/core'
import { Link } from 'atomic-router-react'
import { PropsWithChildren } from 'react'
import { routes } from '../../routing/index.ts'
import { Chat } from '../../widgets/chat'
import { Logo } from './logo.tsx'
import { Menu } from './menu.tsx'
import { MiniProfile } from './mini-profile.tsx'

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-full flex flex-col pb-8">
      <Left />
      <main className="pl-[280px] pr-[320px] pt-[104px] pb-6">{children}</main>
      <Right />
    </div>
  )
}

const Left = () => {
  return (
    <div className="fixed top-0 left-0 bottom-0 w-[280px] p-6">
      <Link
        to={routes.home}
        className="w-full flex items-center justify-center gap-2 p-2 mb-4"
      >
        <Logo />
        <Title className="hidden md:block" order={1}>
          Sigma
        </Title>
      </Link>
      <Menu />
    </div>
  )
}

const Right = () => {
  return (
    <div className="fixed top-0 right-0 bottom-0 w-[320px] p-6">
      <MiniProfile />
      <div className="flex-1">
        <Chat />
      </div>
    </div>
  )
}
