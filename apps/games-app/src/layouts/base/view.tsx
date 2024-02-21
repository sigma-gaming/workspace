import { Menu, MenuLink, MenuSection, useMedia } from '@libs/ui'
import { rem, Title } from '@mantine/core'
import { IconCategory2, IconDice3 } from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { PropsWithChildren } from 'react'
import { routes } from '../../routing/index.ts'
import { Chat } from '../../widgets/chat'
import { Logo } from './logo.tsx'
import { MiniProfile } from './mini-profile.tsx'
import { MobileMenu } from './mobile-menu.tsx'

export const BaseLayout = ({ children }: PropsWithChildren) => {
  const isMobile = useMedia({ to: 'md' })
  const leftVisible = !isMobile
  const rightVisible = !isMobile

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main
        className={clsx(
          'px-6 pb-6',
          leftVisible && 'pl-[280px]',
          rightVisible && 'pr-[320px]',
          isMobile && 'pt-6 pb-[84px]',
        )}
      >
        {children}
      </main>
      {leftVisible && <Left />}
      {rightVisible && <Right />}
      {isMobile && <MobileMenu />}
    </div>
  )
}

const Header = () => {
  return (
    <div className="sticky top-0 z-10 lg:h-[112px] py-2 bg-[#25273A] lg:bg-transparent flex items-center justify-between rounded-b-2xl lg:rounded-none shadow-border lg:shadow-none">
      <div className="w-[280px] pl-4 flex justify-start lg:justify-center">
        <Link to={routes.home} className="flex items-center gap-2 p-2">
          <Logo />
          <Title className="hidden lg:block" order={1}>
            Sigma
          </Title>
        </Link>
      </div>
      <div className="pr-6 py-2">
        <MiniProfile />
      </div>
    </div>
  )
}

const Left = () => {
  return (
    <div className="fixed top-[112px] left-0 bottom-0 w-[280px] p-6 pt-0">
      <Menu>
        <MenuLink
          to={routes.home}
          icon={<IconCategory2 style={{ width: rem(24), height: rem(24) }} />}
        >
          Главная
        </MenuLink>
        <MenuSection label="Игры">
          <MenuLink
            to={routes.dicesGame}
            icon={<IconDice3 style={{ width: rem(24), height: rem(24) }} />}
          >
            Dices
          </MenuLink>
        </MenuSection>
      </Menu>
    </div>
  )
}

const Right = () => {
  return (
    <div className="fixed top-[112px] right-0 bottom-0 w-[320px] p-6 pt-0">
      <Chat />
    </div>
  )
}
