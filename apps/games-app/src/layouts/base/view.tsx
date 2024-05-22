import { useMedia } from '@libs/ui'
import { Title } from '@mantine/core'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { CSSProperties, PropsWithChildren } from 'react'
import { routes } from '../../routing/index.ts'
import { Chat } from '../../widgets/chat'
import { Logo } from './logo.tsx'
import { BaseLayoutMenu } from './menu.tsx'
import { MiniProfile } from './mini-profile.tsx'
import { MobileTabs } from './mobile-tabs.tsx'

function useHeaderHeight() {
  if (useMedia({ from: 'lg' })) return '112px'
  return '64px'
}

function useTabsHeight() {
  return '48px'
}

export const BaseLayout = ({ children }: PropsWithChildren) => {
  const headerHeight = useHeaderHeight()
  const tabsHeight = useTabsHeight()
  const isMobile = useMedia({ to: 'md' })
  const leftVisible = !isMobile
  const rightVisible = !isMobile

  const cssVariablesStyle = {
    '--header-height': headerHeight,
    '--tabs-height': tabsHeight,
  } as CSSProperties

  return (
    <div className="min-h-full flex flex-col" style={cssVariablesStyle}>
      <Header />
      <main
        className={clsx(
          'pb-4 lg:pb-6',
          leftVisible ? 'pl-[280px]' : 'pl-4 lg:pl-6',
          rightVisible ? 'pr-[320px]' : 'pr-4 lg:pr-6',
          isMobile && 'pt-6 pb-[84px]',
        )}
      >
        {children}
      </main>
      {leftVisible && <Left />}
      {rightVisible && <Right />}
      {isMobile && <MobileTabs />}
    </div>
  )
}

const Header = () => {
  return (
    <div className="sticky top-0 z-50 h-[--header-height] py-2 bg-[#25273A] lg:bg-transparent flex items-center justify-between shadow-border lg:shadow-none">
      <div className="w-[280px] pl-2 lg:pl-4 flex justify-start lg:justify-center">
        <Link
          to={routes.home}
          className="flex items-center gap-2 p-2 focus:outline-primary rounded-xl"
        >
          <Logo />
          <Title className="hidden lg:block" order={1}>
            Sigma
          </Title>
        </Link>
      </div>
      <div className="pr-4 py-2 lg:pr-6">
        <MiniProfile />
      </div>
    </div>
  )
}

const Left = () => {
  return (
    <div className="fixed top-[112px] left-0 bottom-0 w-[280px] p-6 pt-0">
      <BaseLayoutMenu />
    </div>
  )
}

const Right = () => {
  return (
    <div className="fixed top-[--header-height] right-0 bottom-0 w-[320px] p-6 pt-0">
      <Chat />
    </div>
  )
}
