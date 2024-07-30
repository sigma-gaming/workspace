import { Card } from '@mantine/core'
import { PropsWithChildren } from 'react'
import { GameHistoryTable } from '../../widgets/game-history-table'
import { BaseLayout } from '../base'

export const GameLayout = ({ children }: PropsWithChildren) => {
  return (
    <BaseLayout className="flex flex-col gap-6">
      <Card className="p-4 rounded-xl md:p-6 md:rounded-2xl">{children}</Card>
      <GameHistoryTable />
    </BaseLayout>
  )
}
