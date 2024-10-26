import { Icons, useMedia } from '@core/ui'
import { Divider } from '@mantine/core'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { ReactNode } from 'react'
import { routes } from '../../routing/index.ts'
import { Chat } from '../../widgets/chat'
import { Copyright } from '../../widgets/copyright/index.tsx'
import { BaseLayoutMenu } from './menu.tsx'
import { MiniProfile } from './mini-profile.tsx'
import { MobileTabs } from './mobile-tabs.tsx'

function useHeaderHeight() {
  const fromLg = useMedia({ from: 'lg' })
  const fromMd = useMedia({ from: 'sm' })
  if (fromLg) return '112px'
  if (fromMd) return '80px'
  return '64px'
}

function useTabsHeight() {
  const fromLg = useMedia({ from: 'lg' })
  if (fromLg) return '0px'
  return '56px'
}

type Props = {
  className?: string
  children: ReactNode
}

export const BaseLayout = ({ className, children }: Props) => {
  const headerHeight = useHeaderHeight()
  const tabsHeight = useTabsHeight()
  const isMobile = useMedia({ to: 'md' })
  const leftVisible = !isMobile
  const rightVisible = !isMobile

  return (
    <div className="min-h-full flex flex-col">
      <style>
        {`
          :root {
            --header-height: ${headerHeight};
            --tabs-height: ${tabsHeight};
          }
        `}
      </style>
      <Header />
      <div
        className={clsx(
          'grow flex flex-col gap-6 pb-4 lg:pb-6',
          leftVisible ? 'pl-[280px]' : 'pl-4 lg:pl-6',
          rightVisible ? 'pr-[320px]' : 'pr-4 lg:pr-6',
          isMobile && 'pt-6 pb-[--tabs-height]',
        )}
      >
        <main className={className}>{children}</main>
        {isMobile && (
          <footer className="mt-auto pt-6">
            <Divider />
            <div className="py-6">
              <Copyright className="text-sm text-center" />
            </div>
          </footer>
        )}
      </div>
      {leftVisible && <Left />}
      {rightVisible && <Right />}
      {isMobile && <MobileTabs />}
    </div>
  )
}

const Header = () => {
  return (
    <div className="pointer-events-none sticky top-0 z-[200] h-[--header-height] py-2 bg-[#1B1C2F] bg-opacity-80 lg:bg-transparent flex items-center justify-between backdrop-blur-md lg:backdrop-blur-none shadow-border lg:shadow-none">
      <div className="pointer-events-auto w-[280px] pl-2 lg:py-2 lg:px-6 flex justify-start lg:justify-center">
        <Link
          aria-label="Перейти на главную страницу"
          to={routes.games}
          className="flex items-center gap-2 p-2 focus-visible:outline-primary rounded-xl"
        >
          <Icons.Sigma />
          <h1 className="hidden lg:block text-4xl leading-none font-medium">
            Sigma
          </h1>
        </Link>
      </div>
      <div className="pointer-events-auto pr-4 py-2 lg:pr-6">
        <MiniProfile />
      </div>
    </div>
  )
}

const Left = () => {
  return (
    <div className="fixed top-[112px] left-0 bottom-0 flex flex-col gap-4 w-[280px] p-6 pt-0">
      <BaseLayoutMenu />
      <div className="mt-auto">
        <Copyright />
      </div>
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
