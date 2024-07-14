import { Game, GameOutcome, GameRecordSelect } from '@dbs/games-schema'
import { Card, Tabs } from '@mantine/core'
import { useIsFirstRender } from '@mantine/hooks'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { memo, ReactNode, useEffect } from 'react'
import { $$user } from '../../entities/user'
import { routes } from '../../routing'
import { formatGem } from '../../shared/lib/format/currency'
import { Icons } from '../../shared/ui/icons'
import { $$gameHistory, Tab } from './model'
import styles from './table.module.css'

const gameToLabelMap: Record<Game, string> = {
  [Game.Dice]: 'Dice',
}

const gameToIconMap: Record<Game, ReactNode> = {
  [Game.Dice]: <Icons.Dice width={16} height={16} />,
}

const gameToRouteMap: Record<Game, RouteInstance<RouteParams>> = {
  [Game.Dice]: routes.diceGame,
}

export const GameHistoryTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const loggedIn = useUnit($$user.$loggedIn)

  useEffect(() => {
    $$gameHistory.initialize()
    return () => $$gameHistory.reset()
  }, [])

  return (
    <Card className="grow p-0 rounded-xl md:rounded-2xl">
      <Tabs
        value={tab}
        onChange={(tab) => $$gameHistory.setTab(tab as Tab | null)}
      >
        <Tabs.List>
          <Tabs.Tab
            value="last-wins"
            className="px-4 md:px-6 py-4"
            leftSection={<Icons.Transfer width={20} height={20} />}
          >
            Все игры
          </Tabs.Tab>
          <Tabs.Tab
            value="big-wins"
            className="px-4 md:px-6 py-4"
            leftSection={<Icons.TrendingUp width={20} height={20} />}
          >
            Крупные выигрыши
          </Tabs.Tab>
          {loggedIn && (
            <Tabs.Tab
              value="my-games"
              className="px-4 md:px-6 py-4"
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
  if (tab !== 'last-wins') return null
  if (lastWins.length === 0) return null
  return <HistoryTable records={lastWins} />
}

const BigWinsTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const bigWins = useUnit($$gameHistory.$bigWins)
  if (tab !== 'big-wins') return null
  if (bigWins.length === 0) return null
  return <HistoryTable records={bigWins} />
}

const MyGamesTable = () => {
  const tab = useUnit($$gameHistory.$tab)
  const myGames = useUnit($$gameHistory.$myGames)
  if (tab !== 'my-games') return null
  if (myGames.length === 0) return null
  return <HistoryTable records={myGames} />
}

const HistoryTable = memo(({ records }: { records: GameRecordSelect[] }) => {
  // Used to skip animation of first render
  const isFirstRender = useIsFirstRender()

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.row}>
          <Cell type="head" className="font-medium">
            Игра
          </Cell>
          <Cell
            type="head"
            className="font-medium hidden sm:table-cell lg:hidden xl:table-cell"
          >
            Игрок
          </Cell>
          <Cell
            type="head"
            className="font-medium hidden sm:table-cell lg:hidden xl:table-cell"
            align="center"
          >
            Ставка
          </Cell>
          <Cell
            type="head"
            className="font-medium hidden sm:table-cell lg:hidden xl:table-cell"
            align="center"
          >
            Множитель
          </Cell>
          <Cell type="head" className="font-medium" align="right">
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

const Row = memo(
  ({ record, animated }: { record: GameRecordSelect; animated: boolean }) => {
    const route = gameToRouteMap[record.game]
    const hasWon = record.outcome === GameOutcome.Win
    const highlight = hasWon ? 'success' : 'failure'

    const multiplier = hasWon ? Math.floor(100 + record.multiplier) / 100 : 0

    const payout = hasWon
      ? formatGem((record.bet + record.payout) / 100)
      : formatGem(record.payout / 100)

    return (
      <tr className={styles.row} data-animated={animated}>
        <Cell className="flex gap-2 items-center">
          {gameToIconMap[record.game]}
          <Link to={route}>{gameToLabelMap[record.game]}</Link>
        </Cell>
        <Cell
          className="max-w-[120px] hidden sm:table-cell lg:hidden xl:table-cell"
          textColor="primary"
        >
          {record.previewUserName}
        </Cell>
        <Cell
          className="hidden sm:table-cell lg:hidden xl:table-cell"
          align="center"
        >
          {formatGem(record.bet / 100)}g
        </Cell>
        <Cell
          className="hidden sm:table-cell lg:hidden xl:table-cell"
          align="center"
          textColor={highlight}
        >
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
  children: ReactNode
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
    'px-4 md:px-6 py-2 h-11 font-interface text-ellipsis',
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
