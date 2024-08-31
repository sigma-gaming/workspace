import { GlobalTaskKey } from '@dbs/games-types'
import clsx from 'clsx'
import { ReactNode } from 'react'
import { GlobalTaskCard } from './ui/global-task-card'
import { PromocodeCard } from './ui/promocode-card'

const BannerGrid = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={clsx(
        'grid gap-4 grid-cols-1',
        'md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
      )}
    >
      {children}
    </div>
  )
}

const TaskGrid = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={clsx(
        'grid gap-4 grid-cols-1',
        'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1',
        'xl:flex xl:flex-wrap',
      )}
    >
      {children}
    </div>
  )
}

export const BonusesPageView = () => {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h2 className="text-2xl font-medium mt-0 mb-4 md:mb-6">Бонусы</h2>
        <BannerGrid>
          <PromocodeCard />
        </BannerGrid>
      </div>

      <div>
        <h3 className="text-xl font-medium mt-2 mb-4 md:mb-6">Задания</h3>
        <TaskGrid>
          <GlobalTaskCard taskKey={GlobalTaskKey.TelegramGroupSubscribe} />
          <GlobalTaskCard taskKey={GlobalTaskKey.VkGroupSubscribe} />
          <GlobalTaskCard taskKey={GlobalTaskKey.VkPinnedRepost} />
        </TaskGrid>
      </div>
    </div>
  )
}
