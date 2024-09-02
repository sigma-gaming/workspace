import { Icons, LinkButton, useMedia } from '@core/ui'
import { GlobalTaskSelect } from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { Button, Card, Skeleton, Tooltip } from '@mantine/core'
import { IconCircleCheck, IconRefresh } from '@tabler/icons-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { ReactNode } from 'react'
import { $$user } from '../../../entities/user'
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
    '#4dc3ff 0px 0px 100px 100px, #3b9dce 0px 0px 200px 100px',
  [GlobalTaskKey.VkGroupSubscribe]:
    '#4d97ff 0px 0px 100px 100px, #3b78ce 0px 0px 200px 100px',
  [GlobalTaskKey.VkPinnedRepost]:
    '#4d97ff 0px 0px 100px 100px, #3b78ce 0px 0px 200px 100px',
}

const tooltipMap: Record<GlobalTaskKey, ReactNode> = {
  [GlobalTaskKey.TelegramGroupSubscribe]: (
    <ol className="list-decimal list-inside">
      <li>Привяжите Telegram к&nbsp;аккаунту Sigma</li>
      <li>Перейдите в&nbsp;группу с&nbsp;помощью кнопки "Подписаться"</li>
      <li>
        Подпишитесь на&nbsp;группу с&nbsp;аккаунта Telegram, который привязан
        к&nbsp;вашему профилю на&nbsp;Sigma
      </li>
      <li>Нажмите на&nbsp;кнопку "Проверить"</li>
    </ol>
  ),
  [GlobalTaskKey.VkGroupSubscribe]: (
    <ol className="list-decimal list-inside">
      <li>Привяжите VK к&nbsp;аккаунту Sigma</li>
      <li>Перейдите в&nbsp;группу с&nbsp;помощью кнопки "Подписаться"</li>
      <li>
        Подпишитесь на&nbsp;группу с&nbsp;аккаунта VK, который привязан
        к&nbsp;вашему профилю на&nbsp;Sigma
      </li>
      <li>Нажмите на&nbsp;кнопку "Проверить"</li>
    </ol>
  ),
  [GlobalTaskKey.VkPinnedRepost]: (
    <ol className="list-decimal list-inside">
      <li>Привяжите VK к&nbsp;аккаунту Sigma</li>
      <li>Перейдите к&nbsp;посту с&nbsp;помощью кнопки "Сделать репост"</li>
      <li>
        Сделайте репост поста с&nbsp;аккаунта VK, который привязан к&nbsp;вашему
        профилю на&nbsp;Sigma
      </li>
      <li>
        Убедитесь, что в&nbsp;настройке "Кому в&nbsp;интернете видна
        моя&nbsp;страница" выбрано "Всем"
      </li>
      <li>Убедитесь, что в&nbsp;настройке "Тип профиля" выбрано "Открытый"</li>
      <li>Нажмите на&nbsp;кнопку "Проверить"</li>
    </ol>
  ),
}

const cardClassName =
  'relative p-0 xl:w-full xl:max-w-[340px] rounded-2xl md:rounded-3xl'
const actionClassName = 'grow lg:grow-0'

const CardSkeleton = () => {
  return (
    <Skeleton
      className={clsx(cardClassName, 'h-[262px] md:h-[295px] lg:h-[304px]')}
    />
  )
}

const CardActions = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={clsx(
        'flex flex-row flex-wrap gap-2 mt-24',
        'lg:flex-row lg:mt-28',
      )}
    >
      {children}
    </div>
  )
}

export const GlobalTaskCard = ({ taskKey }: Props) => {
  const title = titleMap[taskKey]
  const image = imageMap[taskKey]
  const action = actionMap[taskKey]
  const boxShadow = boxShadowMap[taskKey]
  const tooltip = tooltipMap[taskKey]
  const loggedIn = useUnit($$user.$loggedIn)
  const tasks = useUnit($$bonusesPage.$globalTasks)
  const statuses = useUnit($$bonusesPage.$globalTaskStatuses)
  const task = tasks?.find((task) => task.key === taskKey)
  const completingMap = useUnit($$bonusesPage.$completingGlobalTaskMap)
  const claimingRewardMap = useUnit($$bonusesPage.$claimingGlobalTaskRewardMap)
  const completing = completingMap[taskKey]
  const claimingReward = claimingRewardMap[taskKey]
  const isMobile = useMedia({ to: 'md' })
  const buttonSize = isMobile ? 'xs' : 'sm'

  if (!task) {
    return <CardSkeleton />
  }

  const actionUrl = action.createUrl(task)
  const status = statuses[taskKey]
  const disabled = !task.isActive

  return (
    <Card
      className={clsx(
        cardClassName,
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <div
        className={clsx(
          'relative z-10 flex flex-col h-full',
          disabled && 'pointer-events-none',
        )}
      >
        <div className="absolute z-0 right-0 bottom-24 md:bottom-[132px] lg:bottom-24 lg:top-6 flex items-center justify-center pt-6 px-6">
          <div
            className="absolute top-1/2 left-1/2 rounded-full opacity-50"
            style={{ boxShadow }}
          />
          <img
            className="relative z-10 aspect-square w-full max-w-[120px] lg:max-w-[160px]"
            src={image}
            alt="Social Network"
          />
        </div>

        <div className="absolute z-[1] inset-0 bg-[#1B1C2F] bg-opacity-50" />

        <div className="z-[2] grow flex flex-col px-4 py-6 md:px-6 md:pb-8">
          <h3 className="text-xl lg:text-2xl font-medium leading-tight">
            {title}
          </h3>

          <p className="mt-2 text-sm lg:text-base max-w-[360px] leading-snug mb-auto">
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
            <CardActions>
              {actionUrl ? (
                <LinkButton
                  className={actionClassName}
                  color="blue"
                  size={buttonSize}
                  to={actionUrl}
                  target={action.target}
                >
                  {action.name}
                </LinkButton>
              ) : (
                <Button
                  className={actionClassName}
                  color="blue"
                  size={buttonSize}
                  disabled={true}
                >
                  {action.name}
                </Button>
              )}
              <Button
                className={actionClassName}
                color="blue"
                size={buttonSize}
                onClick={() => $$bonusesPage.completeGlobalTask(taskKey)}
                loading={completing}
                disabled={!loggedIn}
                rightSection={<IconRefresh width={16} height={16} />}
              >
                Проверить
              </Button>
            </CardActions>
          )}

          {status === TaskStatus.Completed && (
            <CardActions>
              <Button
                className={actionClassName}
                color="green"
                size={buttonSize}
                onClick={() => $$bonusesPage.claimGlobalTaskReward(taskKey)}
                loading={claimingReward}
              >
                Забрать награду
              </Button>
            </CardActions>
          )}

          {status === TaskStatus.Claimed && (
            <CardActions>
              <div className="flex items-center gap-1.5 h-[30px] lg:h-9 text-[color:var(--mantine-color-green-6)] leading-tight">
                <IconCircleCheck className="shrink-0 w-5 h-5 lg:w-6 lg:h-6" />
                <p className="text-sm lg:text-base font-medium">
                  Награда получена
                </p>
              </div>
            </CardActions>
          )}

          <div className="mt-4 flex gap-2 items-center select-none">
            <p className="text-xs text-dimmed">Как получить бонус?</p>
            <Tooltip className="w-[328px] max-w-full" label={tooltip}>
              <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  )
}
