import { Game, GameOutcome, GameRecordSelect } from '@dbs/games-schema'
import { Card, Tabs } from '@mantine/core'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { createElement, ReactNode, useEffect } from 'react'
import { routes } from '../../routing'
import { formatGem } from '../../shared/lib/format/currency'
import { Icons } from '../../shared/ui/icons'
import { $$gameHistory } from './model'

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
  useEffect(() => {
    $$gameHistory.initialize()
    return () => $$gameHistory.reset()
  }, [])

  return (
    <Card className="grow p-0 rounded-xl md:rounded-2xl">
      <Tabs defaultValue="last-wins">
        <Tabs.List>
          <Tabs.Tab value="last-wins" className="px-6 py-4 font-interface">
            Все игры
          </Tabs.Tab>
          <Tabs.Tab value="my-games" className="px-6 py-4 font-interface">
            Мои игры
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="last-wins">
          <LastWinsTable />
        </Tabs.Panel>

        <Tabs.Panel value="my-games">
          <MyGamesTable />
        </Tabs.Panel>
      </Tabs>
    </Card>
  )
}

const LastWinsTable = () => {
  const lastWins = useUnit($$gameHistory.$lastWins)
  return <HistoryTable records={lastWins} />
}

const MyGamesTable = () => {
  const myGames = useUnit($$gameHistory.$myGames)
  return <HistoryTable records={myGames} />
}

const HistoryTable = ({ records }: { records: GameRecordSelect[] }) => {
  return (
    <table className="w-full text-left">
      <thead>
        <tr>
          <Cell type="head" className="font-medium">
            Игра
          </Cell>
          <Cell type="head" className="font-medium">
            Игрок
          </Cell>
          <Cell type="head" className="font-medium" align="center">
            Ставка
          </Cell>
          <Cell type="head" className="font-medium" align="center">
            Множитель
          </Cell>
          <Cell type="head" className="font-medium" align="right">
            Выплата
          </Cell>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const route = gameToRouteMap[record.game]
          const hasWon = record.outcome === GameOutcome.Win
          const highlight = hasWon ? 'success' : 'failure'

          const multiplier = hasWon
            ? Math.floor(100 + record.multiplier) / 100
            : 0

          const payout = hasWon
            ? formatGem((record.bet + record.payout) / 100)
            : formatGem(record.payout / 100)

          return (
            <tr key={record.id} className="border-t-[1px] border-[#25273E]">
              <Cell className="flex gap-2 items-center">
                {gameToIconMap[record.game]}
                <Link to={route}>{gameToLabelMap[record.game]}</Link>
              </Cell>
              <Cell textColor="primary">{record.previewUserName}</Cell>
              <Cell align="center">{formatGem(record.bet / 100)}g</Cell>
              <Cell align="center" textColor={highlight}>
                {multiplier}x
              </Cell>
              <Cell align="right" textColor={highlight}>
                {payout}g
              </Cell>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface CellProps {
  type?: 'head' | 'row'
  className?: string
  children: ReactNode
  textSize?: 'sm' | 'xs'
  textColor?: 'default' | 'primary' | 'success' | 'failure'
  align?: 'left' | 'center' | 'right'
}

const Cell = ({
  className,
  type = 'row',
  children,
  textSize = type === 'head' ? 'xs' : 'sm',
  textColor = 'default',
  align = 'left',
}: CellProps) => {
  return createElement(
    type === 'head' ? 'th' : 'td',
    {
      className: clsx(
        className,
        'px-4 md:px-6 py-2 h-11 font-interface',
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
      ),
    },
    children,
  )
}
