import { Icons } from '@core/ui'
import { formatGem, gemFloat } from '@games/model'
import { Button, Card, CopyButton, Skeleton, Tooltip } from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconLink,
  IconUserPlus,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { ReactNode } from 'react'
import { $$affiliate } from '../../entities/affiliate'
import { $$user } from '../../entities/user'
import { env } from '../../shared/env'
import { $$affiliatePage } from './model'

const BalanceCard = () => {
  const balance = useUnit($$affiliatePage.$balance)
  const balanceLoaded = useUnit($$affiliatePage.$balanceLoaded)
  const withdrawing = useUnit($$affiliatePage.$withdrawing)

  return (
    <Skeleton visible={!balanceLoaded}>
      <Card className="gap-4 items-start min-h-[192px]">
        <h2 className="text-lg font-medium leading-tight">
          Реферальный баланс
        </h2>
        <p className="flex items-center gap-1.5 leading-none font-medium text-xl lg:text-2xl">
          <span
            className={clsx(
              balance > 0 && 'text-green-400',
              balance < 0 && 'text-red-400',
            )}
          >
            {formatGem(gemFloat(balance))}
          </span>
          <Icons.Gem className="w-6 h-6 text-primary-400" />
        </p>
        <Button
          className="w-full md:w-auto mt-auto min-w-[184px]"
          loading={withdrawing}
          onClick={() => $$affiliatePage.withdraw()}
        >
          Вывести
        </Button>
        <div className="flex gap-2 items-center select-none">
          <p className="text-xs lg:text-sm text-dimmed">
            Когда начисляется баланс?
          </p>
          <Tooltip
            className="max-w-[250px] leading-snug"
            label={
              <>
                Баланс начисляется 1-го и&nbsp;15-го числа каждого месяца, если
                на&nbsp;этот момент имеются необработанные реферальные
                транзакции
              </>
            }
          >
            <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
          </Tooltip>
        </div>
      </Card>
    </Skeleton>
  )
}

const RevShareCard = () => {
  const settings = useUnit($$affiliatePage.$settings)
  const settingsLoaded = useUnit($$affiliatePage.$settingsLoaded)

  return (
    <Skeleton visible={!settingsLoaded}>
      <Card className="gap-4 min-h-[192px]">
        <h2 className="text-lg font-medium leading-tight">Уровень дохода</h2>
        <p className="flex items-center gap-1.5 leading-none font-medium text-green-400 text-xl lg:text-2xl">
          <span>{settings?.referralLossShare}%</span>
        </p>
        <div className="mt-auto flex gap-2 items-center select-none">
          <p className="text-xs lg:text-sm text-dimmed">
            Как увеличить процент дохода?
          </p>
          <Tooltip
            className="max-w-[250px] leading-snug"
            label={
              <>
                Если у&nbsp;вас крупная аудитория и&nbsp;вы заинтересованы
                в&nbsp;специальных условиях, свяжитесь с&nbsp;поддержкой
                для&nbsp;получения дополнительной информации
              </>
            }
          >
            <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
          </Tooltip>
        </div>
      </Card>
    </Skeleton>
  )
}

const LinkCard = () => {
  const primaryCampaign = useUnit($$affiliatePage.$primaryCampaign)
  const campaignsLoaded = useUnit($$affiliatePage.$campaignsLoaded)
  const link = `${env.referralRedirectApi.url}/?r=${primaryCampaign?.code}`

  return (
    <Skeleton visible={!campaignsLoaded}>
      <Card className="gap-4 min-h-[112px]">
        <h2 className="text-lg font-medium leading-tight">
          Ваша реферальная ссылка
        </h2>
        <CopyButton value={link} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? 'Скопировано!' : 'Скопировать ссылку'}
              className="text-sm px-2 py-1"
              position="right"
            >
              <button
                className="mt-auto flex items-center justify-between gap-2 pl-3 pr-[9px] h-9 bg-[var(--mantine-color-input-bg)] rounded-lg select-none"
                onClick={copy}
              >
                <span className="text-sm truncate">{link}</span>
                {copied ? (
                  <IconCheck
                    className="text-green-600"
                    width={18}
                    height={18}
                  />
                ) : (
                  <IconCopy className="text-dimmed" width={18} height={18} />
                )}
              </button>
            </Tooltip>
          )}
        </CopyButton>
      </Card>
    </Skeleton>
  )
}

const Stats = () => {
  const primaryCampaign = useUnit($$affiliatePage.$primaryCampaign)
  const campaignsLoaded = useUnit($$affiliatePage.$campaignsLoaded)

  return (
    <Skeleton visible={!campaignsLoaded}>
      <Grid cols={2}>
        <Card className="gap-4">
          <IconLink className="w-8 h-8" />
          <div className="flex flex-col gap-2">
            <p className="text-xl leading-none font-semibold">
              {primaryCampaign?.totalVisits}
            </p>
            <p className="leading-none text-dimmed">Переходы</p>
          </div>
        </Card>
        <Card className="gap-4">
          <IconUserPlus className="w-8 h-8" />
          <div className="flex flex-col gap-2">
            <p className="text-xl leading-none font-semibold">
              {primaryCampaign?.totalSignups}
            </p>
            <p className="leading-none text-dimmed">Регистрации</p>
          </div>
        </Card>
      </Grid>
    </Skeleton>
  )
}

const Grid = ({ cols, children }: { cols: 2 | 3; children: ReactNode }) => {
  return (
    <div
      className={clsx(
        'grid gap-4 2xl:gap-6 grid-cols-1',
        cols === 2 && 'md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
        cols === 3 && 'md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3',
      )}
    >
      {children}
    </div>
  )
}

const ConnectedContent = () => {
  return (
    <div className="flex flex-col gap-4 2xl:gap-6">
      <Grid cols={2}>
        <BalanceCard />
        <RevShareCard />
      </Grid>
      <Grid cols={2}>
        <div className="flex flex-col gap-4 2xl:gap-6">
          <LinkCard />
          <Stats />
        </div>
      </Grid>
    </div>
  )
}

const NotConnectedContent = () => {
  const connecting = useUnit($$affiliate.$connecting)
  const loggedIn = useUnit($$user.$loggedIn)

  return (
    <>
      <p>
        Присоединяйтесь к&nbsp;нашей партнёрской программе и&nbsp;получайте{' '}
        <b>до&nbsp;50%</b> от&nbsp;нашего дохода
      </p>
      <Button
        className="w-full md:w-56 lg:w-full xl:w-56"
        onClick={() => $$affiliate.connect()}
        loading={connecting}
        disabled={!loggedIn}
      >
        Подключиться
      </Button>
    </>
  )
}

const Content = () => {
  const isConnected = useUnit($$affiliate.$isConnected)
  const loaded = useUnit($$affiliate.$loaded)
  const loggedIn = useUnit($$user.$loggedIn)

  if (!loggedIn) {
    return <NotConnectedContent />
  }

  if (!loaded) {
    return <Skeleton height={192} />
  }

  return isConnected ? <ConnectedContent /> : <NotConnectedContent />
}

export const AffiliatePageView = () => {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h2 className="text-2xl font-medium">Партнёрам</h2>
      <Content />
    </div>
  )
}
