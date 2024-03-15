import { IconCategory2, IconMenu2, IconMessage } from '@tabler/icons-react'

export const MobileTabs = () => {
  return (
    <div className="fixed left-0 right-0 bottom-0 flex h-[48px] bg-[#25273C] rounded-t-2xl shadow-border">
      <button className="flex-1 flex items-center justify-center">
        <IconMenu2 className="w-6 h-6" />
      </button>
      <button className="flex-1 flex items-center justify-center">
        <IconCategory2 className="w-6 h-6" />
      </button>
      <button className="flex-1 flex items-center justify-center">
        <IconMessage className="w-6 h-6" />
      </button>
    </div>
  )
}
