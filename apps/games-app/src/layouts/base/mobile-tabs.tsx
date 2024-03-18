import { IconCategory2, IconMenu2, IconMessage } from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import { useState } from 'react'
import { routes } from '../../routing'
import { Chat } from '../../widgets/chat'
import { BaseLayoutMenu } from './menu'

enum Tab {
  Menu,
  Chat,
}

export const MobileTabs = () => {
  const [tab, setTab] = useState<Tab | null>(null)

  const toggle = (tab: Tab) => {
    setTab((previous) => (previous === tab ? null : tab))
  }

  return (
    <>
      <div className="fixed z-50 left-0 right-0 bottom-0 flex h-[--tabs-height] bg-[#25273C] rounded-t-2xl shadow-border">
        <button
          className="flex-1 flex items-center justify-center"
          onClick={() => toggle(Tab.Menu)}
        >
          <IconMenu2 className="w-6 h-6" />
        </button>
        <Link
          to={routes.home}
          className="flex-1 flex items-center justify-center"
          onClick={() => setTab(null)}
        >
          <IconCategory2 className="w-6 h-6" />
        </Link>
        <button
          className="flex-1 flex items-center justify-center"
          onClick={() => toggle(Tab.Chat)}
        >
          <IconMessage className="w-6 h-6" />
        </button>
      </div>

      {tab === Tab.Menu && (
        <div className="fixed z-40 inset-0 pt-[--header-height] pb-[--tabs-height] bg-[#181623]">
          <div className="px-4 py-6 h-full">
            <BaseLayoutMenu onNavigate={() => setTab(null)} />
          </div>
        </div>
      )}

      {tab === Tab.Chat && (
        <div className="fixed z-40 inset-0 pt-[--header-height] pb-[--tabs-height] bg-[#181623]">
          <div className="px-4 py-6 h-full">
            <Chat />
          </div>
        </div>
      )}
    </>
  )
}
