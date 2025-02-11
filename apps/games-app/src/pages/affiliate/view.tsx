import { Avatar, Icons, Table, TableCellTextColor } from '@core/ui'
import { trimText } from '@core/utils'
import { ReferrerTransactionSelect } from '@dbs/games-schema'
import { ReferralAction } from '@dbs/games-types'
import { reflect } from '@effector/reflect'
import { formatGem, gemFloat, gemInt } from '@games/model'
import {
  Button,
  Card,
  CopyButton,
  Overlay,
  Pagination,
  Skeleton,
  Tooltip,
} from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconLink,
  IconUserPlus,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { not } from 'patronum'
import { ReactNode, useState } from 'react'
import { v7 } from 'uuid'
import { $$affiliate } from '../../entities/affiliate'
import { $$session } from '../../entities/session'
import { env } from '../../shared/env'
import { $$affiliatePage } from './model'
import styles from './styles.module.css'

type ReferrerTransactionDisplay = Pick<
  ReferrerTransactionSelect,
  'id' | 'referralName' | 'referralImage' | 'referralAction' | 'amount'
>

const BalanceCardView = ({
  balance,
  loading = false,
  withdrawing,
  onWithdraw,
}: {
  balance: number
  loading?: boolean
  withdrawing?: boolean
  onWithdraw?: () => void
}) => {
  return (
    <Skeleton visible={loading}>
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
          onClick={onWithdraw}
          disabled={!onWithdraw}
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

const RevShareCardView = ({
  revShare,
  loading = false,
}: {
  revShare: number
  loading?: boolean
}) => {
  return (
    <Skeleton visible={loading}>
      <Card className="gap-4 min-h-[192px]">
        <h2 className="text-lg font-medium leading-tight">Уровень дохода</h2>
        <p className="flex items-center gap-1.5 leading-none font-medium text-green-400 text-xl lg:text-2xl">
          <span>{revShare}%</span>
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

const LinkCardView = ({
  code,
  loading = false,
}: {
  code?: string
  loading?: boolean
}) => {
  const redirectLink = `${env.redirectApi.url}/r/${code}`
  const botLink = `https://t.me/${env.telegram.botUsername}?start=${code}`

  return (
    <Skeleton visible={loading}>
      <Card className="gap-4 min-h-[112px]">
        <h2 className="text-lg font-medium leading-tight">Ваши ссылки</h2>
        <LinkField link={redirectLink} />
        <LinkField link={botLink} />
      </Card>
    </Skeleton>
  )
}

const LinkField = ({ link }: { link: string }) => {
  return (
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
              <IconCheck className="text-green-600" width={18} height={18} />
            ) : (
              <IconCopy className="text-dimmed" width={18} height={18} />
            )}
          </button>
        </Tooltip>
      )}
    </CopyButton>
  )
}

const StatsView = ({
  visits,
  signups,
  loading = false,
}: {
  visits: number
  signups: number
  loading?: boolean
}) => {
  return (
    <Skeleton visible={loading}>
      <Grid cols={2}>
        <Card className="gap-4">
          <IconLink className="w-8 h-8" />
          <div className="flex flex-col gap-2">
            <p className="text-xl leading-none font-semibold">{visits}</p>
            <p className="leading-none text-dimmed">Переходы</p>
          </div>
        </Card>
        <Card className="gap-4">
          <IconUserPlus className="w-8 h-8" />
          <div className="flex flex-col gap-2">
            <p className="text-xl leading-none font-semibold">{signups}</p>
            <p className="leading-none text-dimmed">Регистрации</p>
          </div>
        </Card>
      </Grid>
    </Skeleton>
  )
}

const referralActionLabelMap: Record<ReferralAction, string> = {
  [ReferralAction.Deposit]: 'Пополнение',
  [ReferralAction.Withdrawal]: 'Вывод',
}

const referralActionHighlightMap: Record<ReferralAction, TableCellTextColor> = {
  [ReferralAction.Deposit]: 'success',
  [ReferralAction.Withdrawal]: 'failure',
}

const cellDesktop =
  'hidden sm:table-cell md:hidden lg:table-cell xl:hidden 2xl:table-cell'

const TransactionsTable = ({
  transactions,
}: {
  transactions: ReferrerTransactionDisplay[]
}) => {
  return (
    <Table className={clsx(styles.table, 'grow')}>
      <Table.Head>
        <Table.Cell as="th">Реферал</Table.Cell>
        <Table.Cell as="th" className={cellDesktop} align="center">
          Действие
        </Table.Cell>
        <Table.Cell as="th" align="right">
          Сумма
        </Table.Cell>
      </Table.Head>
      <Table.Body className="max-h-[300px] overflow-y-auto">
        {transactions.map((transaction) => {
          const highlight =
            referralActionHighlightMap[transaction.referralAction]
          const referralName = transaction.referralName ?? 'Неизвестный'

          return (
            <Table.Row key={transaction.id}>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  {transaction.referralImage && (
                    <Avatar
                      src={transaction.referralImage}
                      size={20}
                      alt="Реферал"
                    />
                  )}
                  <span className="leading-tight">
                    {trimText(referralName, 16)}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell
                className={cellDesktop}
                align="center"
                textColor={highlight}
              >
                {referralActionLabelMap[transaction.referralAction]}
              </Table.Cell>
              <Table.Cell align="right" textColor={highlight}>
                {formatGem(gemFloat(transaction.amount))}
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table>
  )
}

const LastTransactionsView = ({
  transactions,
  totalAmount,
  loading = false,
}: {
  transactions: ReferrerTransactionDisplay[]
  totalAmount: number
  loading?: boolean
}) => {
  const [page, setPage] = useState(1)
  const pageCount = Math.ceil(transactions.length / 10)

  return (
    <Skeleton visible={loading}>
      <Card className="gap-4 min-h-full">
        <h2 className="text-lg font-medium leading-tight">
          Действия рефералов
        </h2>

        {transactions.length > 0 ? (
          <div className="grow">
            <TransactionsTable
              transactions={transactions.slice((page - 1) * 10, page * 10)}
            />
            <Pagination
              className="w-fit mx-auto mt-2"
              value={page}
              total={pageCount}
              onChange={setPage}
              size="sm"
              hideWithOnePage
            />
          </div>
        ) : (
          <div className="grow flex items-center justify-center">
            <p className="text-dimmed py-4">Здесь пока что нет транзакций</p>
          </div>
        )}

        <p className="text-sm text-right px-2">
          Будет начислено:{' '}
          <span
            className={clsx(
              'ml-1 font-semibold text-lg',
              totalAmount > 0 && 'text-green-400',
              totalAmount < 0 && 'text-red-400',
            )}
          >
            {formatGem(gemFloat(totalAmount))}
          </span>
        </p>
      </Card>
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

const BalanceCard = reflect({
  view: BalanceCardView,
  bind: {
    balance: $$affiliatePage.$balance,
    withdrawing: $$affiliatePage.$withdrawing,
    onWithdraw: $$affiliatePage.withdraw,
    loading: not($$affiliatePage.$balanceLoaded),
  },
})

const RevShareCard = reflect({
  view: RevShareCardView,
  bind: {
    revShare: $$affiliatePage.$revShare,
    loading: not($$affiliatePage.$settingsLoaded),
  },
})

const LinkCard = reflect({
  view: LinkCardView,
  bind: {
    code: $$affiliatePage.$campaignCode,
    loading: not($$affiliatePage.$campaignsLoaded),
  },
})

const Stats = reflect({
  view: StatsView,
  bind: {
    visits: $$affiliatePage.$campaignVisits,
    signups: $$affiliatePage.$campaignSignups,
    loading: not($$affiliatePage.$campaignsLoaded),
  },
})

const LastTransactions = reflect({
  view: LastTransactionsView,
  bind: {
    transactions: $$affiliatePage.$lastTransactions,
    totalAmount: $$affiliatePage.$previewPayout,
    loading: not($$affiliatePage.$lastTransactionsLoaded),
  },
})

const Layout = ({
  balance,
  revShare,
  link,
  stats,
  lastTransactions,
}: {
  balance: ReactNode
  revShare: ReactNode
  link: ReactNode
  stats: ReactNode
  lastTransactions: ReactNode
}) => {
  return (
    <div className="flex flex-col gap-4 2xl:gap-6">
      <Grid cols={2}>
        {balance}
        {revShare}
      </Grid>
      <Grid cols={2}>
        <div className="flex flex-col gap-4 2xl:gap-6">
          {link}
          {stats}
        </div>
        {lastTransactions}
      </Grid>
    </div>
  )
}

const LoadingContent = () => {
  return (
    <Layout
      balance={<BalanceCardView balance={0} loading={true} />}
      revShare={<RevShareCardView revShare={0} loading={true} />}
      link={<LinkCardView loading={true} />}
      stats={<StatsView visits={0} signups={0} loading={true} />}
      lastTransactions={
        <LastTransactionsView
          transactions={[]}
          totalAmount={0}
          loading={true}
        />
      }
    />
  )
}

const ConnectedContent = () => {
  return (
    <Layout
      balance={<BalanceCard />}
      revShare={<RevShareCard />}
      link={<LinkCard />}
      stats={<Stats />}
      lastTransactions={<LastTransactions />}
    />
  )
}

const NotConnectedContent = () => {
  const connecting = useUnit($$affiliate.$connecting)
  const loggedIn = useUnit($$session.$loggedIn)

  return (
    <div className="relative">
      <Layout
        balance={<BalanceCardView balance={100000000} />}
        revShare={<RevShareCardView revShare={50} />}
        link={<LinkCardView code="s1gmaX" />}
        stats={<StatsView visits={999} signups={99} />}
        lastTransactions={
          <LastTransactionsView
            transactions={[
              {
                id: v7(),
                referralAction: ReferralAction.Deposit,
                amount: gemInt(33333),
                referralImage: null,
                referralName: 'Lydik',
              },
              {
                id: v7(),
                referralAction: ReferralAction.Deposit,
                amount: gemInt(33333),
                referralImage: null,
                referralName: 'Admin',
              },
            ]}
            totalAmount={gemInt(66666)}
          />
        }
      />
      <Overlay
        blur={3}
        color="var(--mantine-color-body)"
        className="flex flex-col items-center md:justify-center px-4 py-24 rounded-lg"
      >
        <div className="text-center">
          <p className="max-w-[360px]">
            Присоединяйтесь к&nbsp;нашей партнёрской программе и&nbsp;получайте{' '}
            <span className="font-semibold">до&nbsp;50%</span>{' '}
            от&nbsp;нашего&nbsp;дохода
          </p>
          <Button
            className="mt-4 w-full max-w-[240px]"
            onClick={() => $$affiliate.connect()}
            loading={connecting}
            disabled={!loggedIn}
          >
            Подключиться
          </Button>
        </div>
      </Overlay>
    </div>
  )
}

const Content = () => {
  const isConnected = useUnit($$affiliate.$isConnected)
  const loaded = useUnit($$affiliate.$loaded)
  const loggedIn = useUnit($$session.$loggedIn)

  if (!loggedIn) {
    return <NotConnectedContent />
  }

  if (!loaded) {
    return <LoadingContent />
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
