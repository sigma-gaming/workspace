import { Icons, LinkButton } from '@core/ui'
import { GlobalTaskSelect } from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { Button, Card, Skeleton, Tooltip } from '@mantine/core'
import { IconCircleCheck, IconRefresh } from '@tabler/icons-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { ReactNode } from 'react'
import bonusTelegramSrc from '../assets/bonus-telegram-400.webp'
import bonusVkSrc from '../assets/bonus-vk-400.webp'
import { $$bonusesPage } from '../model'

type Props = {
  taskKey: GlobalTaskKey
}

const titleMap: Record<GlobalTaskKey, ReactNode> = {
  [GlobalTaskKey.TelegramGroupSubscribe]: <>Подписка на&nbsp;Telegram</>,
  [GlobalTaskKey.VkGroupSubscribe]: <>Подписка на&nbsp;VK</>,
  [GlobalTaskKey.VkPinnedRepost]: <>Репост поста&nbsp;в&nbsp;VK</>,
}

const imageMap: Record<GlobalTaskKey, string> = {
  [GlobalTaskKey.TelegramGroupSubscribe]: bonusTelegramSrc,
  [GlobalTaskKey.VkGroupSubscribe]: bonusVkSrc,
  [GlobalTaskKey.VkPinnedRepost]: bonusVkSrc,
}

type Action = {
  name: string
  target: '_blank' | '_self'
  createUrl: (task: GlobalTaskSelect) => string | null
}

const actionMap: Record<GlobalTaskKey, Action> = {
  [GlobalTaskKey.TelegramGroupSubscribe]: {
    name: 'Подписаться',
    target: '_blank',
    createUrl: ({ requirements }) => {
      if (requirements.type !== GlobalTaskKey.TelegramGroupSubscribe)
        return null
      const { groupHandle } = requirements
      return `https://t.me/${groupHandle}`
    },
  },
  [GlobalTaskKey.VkGroupSubscribe]: {
    name: 'Подписаться',
    target: '_blank',
    createUrl: ({ requirements }) => {
      if (requirements.type !== GlobalTaskKey.VkGroupSubscribe) return null
      const { groupHandle } = requirements
      return `https://vk.com/${groupHandle}`
    },
  },
  [GlobalTaskKey.VkPinnedRepost]: {
    name: 'Сделать репост',
    target: '_blank',
    createUrl: ({ requirements }) => {
      if (requirements.type !== GlobalTaskKey.VkPinnedRepost) return null
      const { groupHandle, groupId, postId } = requirements
      return `https://vk.com/${groupHandle}?w=wall-${groupId}_${postId}`
    },
  },
}

const boxShadowMap: Record<GlobalTaskKey, string> = {
  [GlobalTaskKey.TelegramGroupSubscribe]:
    '#4dc3ff 0px 0px 50px 75px, #3b9dce 0px 0px 150px 75px',
  [GlobalTaskKey.VkGroupSubscribe]:
    '#4d97ff 0px 0px 50px 75px, #3b78ce 0px 0px 150px 75px',
  [GlobalTaskKey.VkPinnedRepost]:
    '#4d97ff 0px 0px 50px 75px, #3b78ce 0px 0px 150px 75px',
}

const CardSkeleton = () => {
  return <Skeleton className="w-full h-[164px] rounded-2xl md:rounded-3xl" />
}

export const GlobalTaskCard = ({ taskKey }: Props) => {
  const title = titleMap[taskKey]
  const image = imageMap[taskKey]
  const action = actionMap[taskKey]
  const boxShadow = boxShadowMap[taskKey]
  const tasks = useUnit($$bonusesPage.$globalTasks)
  const statuses = useUnit($$bonusesPage.$globalTaskStatuses)
  const task = tasks?.find((task) => task.key === taskKey)
  const completingMap = useUnit($$bonusesPage.$completingGlobalTaskMap)
  const claimingRewardMap = useUnit($$bonusesPage.$claimingGlobalTaskRewardMap)
  const completing = completingMap[taskKey]
  const claimingReward = claimingRewardMap[taskKey]

  if (!task) {
    return <CardSkeleton />
  }

  const actionUrl = action.createUrl(task)
  const status = statuses[taskKey]
  const disabled = !task.isActive

  return (
    <Card
      className={clsx(
        'relative p-0 rounded-2xl md:rounded-3xl xl:w-full xl:max-w-[348px]',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <div className={clsx('relative z-10', disabled && 'pointer-events-none')}>
        <div className="relative flex items-center justify-center pt-6">
          <div
            className="absolute top-1/2 left-1/2 rounded-full opacity-25"
            style={{ boxShadow }}
          />
          <img
            className={clsx('relative z-10 w-full max-w-[160px]')}
            src={image}
            alt="Social Network"
          />
        </div>

        <div className="px-4 pb-6 md:px-6 md:pb-8">
          <h3 className="text-2xl font-medium leading-tight">{title}</h3>

          <p className="mt-2 max-w-[360px] leading-snug">
            Получи{' '}
            <span className="inline-block text-primary-4 text-center">
              <Icons.Gem
                className="inline-block -mt-[3px]"
                width={20}
                height={20}
              />
            </span>{' '}
            {formatGem(gemFloat(task.payout))} на баланс
          </p>

          {status === TaskStatus.Pending && (
            <div className="flex flex-wrap gap-2 mt-6">
              {actionUrl ? (
                <LinkButton
                  color="blue"
                  size="sm"
                  to={actionUrl}
                  target={action.target}
                >
                  {action.name}
                </LinkButton>
              ) : (
                <Button color="blue" size="sm" disabled={true}>
                  {action.name}
                </Button>
              )}
              <Button
                color="blue"
                size="sm"
                onClick={() => $$bonusesPage.completeGlobalTask(taskKey)}
                loading={completing}
                rightSection={<IconRefresh width={18} height={18} />}
              >
                Проверить
              </Button>
            </div>
          )}

          {status === TaskStatus.Completed && (
            <div className="flex gap-2 mt-6">
              <Button
                color="green"
                size="sm"
                onClick={() => $$bonusesPage.claimGlobalTaskReward(taskKey)}
                loading={claimingReward}
              >
                Забрать награду
              </Button>
            </div>
          )}

          {status === TaskStatus.Claimed && (
            <div className="flex items-center gap-1.5 mt-6 h-9 text-[color:var(--mantine-color-green-6)] leading-tight">
              <IconCircleCheck className="shrink-0 w-6 h-6" />
              <p className="font-medium">Награда получена</p>
            </div>
          )}

          <div className="mt-4 flex gap-2 items-center select-none">
            <p className="text-sm text-dimmed">Как получить бонус?</p>
            <Tooltip
              label="Хуй тебе, а не бонус"
              position="bottom"
              multiline
              className="max-w-[250px]"
            >
              <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  )
}
