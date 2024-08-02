import { IconCategory2, IconMenu2, IconMessage } from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { useLayoutEffect, useState } from 'react'
import { disablePageScroll, enablePageScroll } from 'scroll-lock'
import { router, routes } from '../../routing'
import { Chat } from '../../widgets/chat'
import { BaseLayoutMenu } from './menu'

enum Tab {
  Menu = 'menu',
  Chat = 'chat',
}

export const MobileTabs = () => {
  const [tab, setTab] = useState<Tab | null>(null)
  const isAtHome = useUnit(router.$activeRoutes).includes(routes.games)

  const toggle = (tab: Tab) => {
    setTab((previous) => (previous === tab ? null : tab))
  }

  useLayoutEffect(() => {
    let disabled = false

    if (tab) {
      disablePageScroll()
      disabled = true
    }

    return () => {
      if (!disabled) return
      enablePageScroll()
    }
  }, [tab])

  return (
    <>
      <div className="fixed z-[400] left-0 right-0 bottom-0 bg-[#1B1C2F] flex justify-around h-[--tabs-height] px-4 bg-opacity-80 backdrop-blur-md shadow-border">
        <button
          className={clsx(
            'relative flex flex-col gap-0.5 w-12 items-center justify-center',
            tab === Tab.Menu && 'text-purple-500',
          )}
          onClick={() => toggle(Tab.Menu)}
        >
          {tab === Tab.Menu && (
            <span className="absolute left-0 -top-px w-full h-px bg-purple-500" />
          )}
          <IconMenu2 className="w-4 h-4" />
          <span className="text-xs">Меню</span>
        </button>
        <Link
          to={routes.games}
          className={clsx(
            'relative flex flex-col gap-0.5 w-12 items-center justify-center',
            isAtHome && tab === null && 'text-purple-500',
          )}
          onClick={() => setTab(null)}
        >
          {isAtHome && tab === null && (
            <span className="absolute left-0 -top-px w-full h-px bg-purple-500" />
          )}
          <IconCategory2 className="w-4 h-4" />
          <span className="text-xs">Игры</span>
        </Link>
        <button
          className={clsx(
            'relative flex flex-col gap-0.5 w-12 items-center justify-center',
            tab === Tab.Chat && 'text-purple-500',
          )}
          onClick={() => toggle(Tab.Chat)}
        >
          {tab === Tab.Chat && (
            <span className="absolute left-0 -top-px w-full h-px bg-purple-500" />
          )}
          <IconMessage className="w-4 h-4" />
          <span className="text-xs">Чат</span>
        </button>
      </div>

      {tab === Tab.Menu && (
        <div
          className="fixed z-[350] inset-0 pt-[--header-height] pb-[--tabs-height] bg-[#181623]"
          data-scroll-lock-scrollable
        >
          <div className="px-4 py-6 h-full">
            <BaseLayoutMenu onNavigate={() => setTab(null)} />
          </div>
        </div>
      )}

      {tab === Tab.Chat && (
        <div className="fixed z-[350] inset-0 pt-[--header-height] pb-[--tabs-height] bg-[#181623]">
          <div className="px-4 py-6 h-full">
            <Chat />
          </div>
        </div>
      )}
    </>
  )
}
