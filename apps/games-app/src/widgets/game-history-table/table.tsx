import { Icons } from '@core/ui'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome, GameSnapshot } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { Card, LoadingOverlay, Tabs, Text } from '@mantine/core'
import { useIsFirstRender } from '@mantine/hooks'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { memo, ReactNode, useEffect, useRef } from 'react'
import { $$user } from '../../entities/user'
import { $$gameHistory, Tab } from '../../features/game-history'
import { routes } from '../../routing'
import styles from './table.module.css'

const gameToLabelMap: Record<Game, string> = {
  [Game.Dice]: 'Dice',
  [Game.Pincode]: 'Pincode',
}

const gameToIconMap: Record<Game, ReactNode> = {
  [Game.Dice]: <Icons.Dice width={16} height={16} />,
  [Game.Pincode]: <Icons.Card width={16} height={16} />,
}

const gameToRouteMap: Record<Game, RouteInstance<RouteParams>> = {
  [Game.Dice]: routes.diceGame,
  [Game.Pincode]: routes.pincodeGame,
}

function getGameResult(snapshot: GameSnapshot): string {
  if (snapshot.game === Game.Dice) return snapshot.outputSide.toString()
  if (snapshot.game === Game.Pincode)
    return snapshot.outputNumber.toString().padStart(4, '0')
  return '?'
}

export const GameHistoryTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const loggedIn = useUnit($$user.$loggedIn)
  const tabListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    $$gameHistory.initialize()
    return () => $$gameHistory.reset()
  }, [])

  useEffect(() => {
    if (!tab) return

    const tabList = tabListRef.current
    if (!tabList) return

    const tabElement = document.querySelector<HTMLButtonElement>(
      `[data-tab="${tab}"]`,
    )
    if (!tabElement) return

    tabList.scrollTo({
      left: tabElement.offsetLeft,
      behavior: 'smooth',
    })
  }, [tab])

  return (
    <Card className="grow p-0 rounded-xl md:rounded-2xl">
      <Tabs
        value={tab}
        onChange={(tab) => $$gameHistory.setTab(tab as Tab | null)}
      >
        <Tabs.List ref={tabListRef} className="scroll-smooth">
          <div className="mr-auto h-[46px] px-6 flex gap-2 items-center justify-center select-none">
            <span className="inline-block relative w-3 h-3">
              <div
                className={clsx(
                  'absolute inset-0 inline-flex rounded-full bg-green-500 -translate-y-px',
                  styles.liveDot,
                )}
              />
              <span className="absolute inset-0 z-10 inline-flex rounded-full bg-green-600" />
            </span>
            <span className="text-sm font-medium">Live</span>
          </div>

          <Tabs.Tab
            value="last-wins"
            data-tab="last-wins"
            className="px-4 md:px-6 py-3"
            leftSection={<Icons.Transfer width={20} height={20} />}
          >
            Все игры
          </Tabs.Tab>
          <Tabs.Tab
            value="big-wins"
            data-tab="big-wins"
            className="px-4 md:px-6 py-3"
            leftSection={<Icons.TrendingUp width={20} height={20} />}
          >
            Крупные выигрыши
          </Tabs.Tab>
          {loggedIn && (
            <Tabs.Tab
              value="my-games"
              data-tab="my-games"
              className="px-4 md:px-6 py-3"
              leftSection={<Icons.History width={20} height={20} />}
            >
              Мои игры
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="last-wins">
          <LastWinsTable />
        </Tabs.Panel>

        <Tabs.Panel value="big-wins">
          <BigWinsTable />
        </Tabs.Panel>

        <Tabs.Panel value="my-games">
          <MyGamesTable />
        </Tabs.Panel>
      </Tabs>
    </Card>
  )
}

const LastWinsTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const lastWins = useUnit($$gameHistory.$lastWins)
  const lastWinsLoaded = useUnit($$gameHistory.$lastWinsLoaded)
  if (tab !== 'last-wins') return null
  if (!lastWinsLoaded) return <TableLoader />
  if (lastWins.length === 0) return <TableEmpty />
  return <HistoryTable records={lastWins} />
}

const BigWinsTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const bigWins = useUnit($$gameHistory.$bigWins)
  const bigWinsLoaded = useUnit($$gameHistory.$bigWinsLoaded)
  if (tab !== 'big-wins') return null
  if (!bigWinsLoaded) return <TableLoader />
  if (bigWins.length === 0) return <TableEmpty />
  return <HistoryTable records={bigWins} />
}

const MyGamesTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const myGames = useUnit($$gameHistory.$myGames)
  const myGamesLoaded = useUnit($$gameHistory.$myGamesLoaded)
  if (tab !== 'my-games') return null
  if (!myGamesLoaded) return <TableLoader />
  if (myGames.length === 0) return <TableEmpty />
  return <HistoryTable records={myGames} />
}

const cellDesktop = 'hidden sm:table-cell lg:hidden xl:table-cell'
const cellLargeDesktop = 'hidden sm:table-cell lg:hidden 2xl:table-cell'

const HistoryTable = memo(({ records }: { records: GameRecordSelect[] }) => {
  // Used to skip animation of first render
  const isFirstRender = useIsFirstRender()

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.row}>
          <Cell type="head">Игра</Cell>
          <Cell type="head" className={cellDesktop}>
            Игрок
          </Cell>
          <Cell type="head" className={cellDesktop} align="center">
            Ставка
          </Cell>
          <Cell type="head" className={cellDesktop} align="center">
            Результат
          </Cell>
          <Cell type="head" className={cellLargeDesktop} align="center">
            Множитель
          </Cell>
          <Cell type="head" align="right">
            Выплата
          </Cell>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          return (
            <Row key={record.id} record={record} animated={!isFirstRender} />
          )
        })}
      </tbody>
    </table>
  )
})

const TableLoader = () => {
  return (
    <div className="relative w-full h-[484px]">
      <LoadingOverlay
        visible={true}
        overlayProps={{ bg: '#1B1C2F' }}
        zIndex={0}
      />
    </div>
  )
}

const TableEmpty = () => {
  return (
    <div className="px-4 md:px-6 py-4">
      <Text>Здесь пока что нет игр</Text>
    </div>
  )
}

const Row = memo(
  ({ record, animated }: { record: GameRecordSelect; animated: boolean }) => {
    const route = gameToRouteMap[record.game]
    const hasWon = record.outcome === GameOutcome.Win
    const highlight = hasWon ? 'success' : 'default'

    const multiplier = hasWon ? Math.floor(100 + record.multiplier) / 100 : 0

    const payout = formatGem(gemFloat(record.bet + record.payout))

    return (
      <tr className={styles.row} data-animated={animated}>
        <Cell className="flex gap-2 items-center">
          {gameToIconMap[record.game]}
          <Link to={route}>{gameToLabelMap[record.game]}</Link>
        </Cell>
        <Cell
          className={clsx('max-w-[120px]', cellDesktop)}
          textColor="primary"
        >
          {record.previewUserName}
        </Cell>
        <Cell className={cellDesktop} align="center">
          {formatGem(gemFloat(record.bet))}g
        </Cell>
        <Cell className={cellDesktop} align="center">
          {getGameResult(record.snapshot)}
        </Cell>
        <Cell className={cellLargeDesktop} align="center" textColor={highlight}>
          {multiplier}x
        </Cell>
        <Cell align="right" textColor={highlight}>
          {payout}g
        </Cell>
      </tr>
    )
  },
)

const Cell = ({
  className: classNameExtra,
  type = 'row',
  children,
  textSize = type === 'head' ? 'xs' : 'sm',
  textColor = 'default',
  align = 'left',
  hidden = false,
}: {
  type?: 'head' | 'row'
  className?: string
  children?: ReactNode
  textSize?: 'sm' | 'xs'
  textColor?: 'default' | 'primary' | 'success' | 'failure'
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
}) => {
  if (hidden) {
    return null
  }

  const className = clsx(
    classNameExtra,
    'h-11 px-4 md:px-6 py-2 text-ellipsis',
    type === 'head' && 'uppercase font-medium',
    textSize === 'xs' && 'text-xs',
    textSize === 'sm' && 'text-sm',
    textColor === 'default' && 'text-[#9494a5]',
    textColor === 'primary' && 'text-[#fcf8f9]',
    textColor === 'success' && 'text-green-400',
    textColor === 'failure' && 'text-red-400',
    align === 'left' && 'text-left',
    align === 'center' && 'text-center',
    align === 'right' && 'text-right',
  )

  if (type === 'head') {
    return <th className={className}>{children}</th>
  }

  return <td className={className}>{children}</td>
}
