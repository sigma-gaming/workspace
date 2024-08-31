import { GlobalTaskKey } from '@dbs/games-types'
import clsx from 'clsx'
import { ReactNode } from 'react'
import { GlobalTaskCard } from './ui/global-task-card'
import { PromocodeCard } from './ui/promocode-card'

const CardGrid = ({
  maxCols,
  children,
}: {
  maxCols: 2 | 3
  children: ReactNode
}) => {
  return (
    <div
      className={clsx(
        'grid gap-4 grid-cols-1',
        maxCols === 2 && 'md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
        maxCols === 3 &&
          'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3',
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
        <CardGrid maxCols={2}>
          <PromocodeCard />
        </CardGrid>
      </div>

      <div>
        <h3 className="text-xl font-medium mt-2 mb-4 md:mb-6">Задания</h3>
        <CardGrid maxCols={3}>
          <GlobalTaskCard taskKey={GlobalTaskKey.TelegramGroupSubscribe} />
          <GlobalTaskCard taskKey={GlobalTaskKey.VkGroupSubscribe} />
          <GlobalTaskCard taskKey={GlobalTaskKey.VkPinnedRepost} />
        </CardGrid>
      </div>
    </div>
  )
}
