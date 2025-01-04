import { Anchor, Loader, Text } from '@mantine/core'
import { useUnit } from 'effector-react'
import { CenteredLayout } from '../../layouts/centered'
import { $$maintenance } from './model'

export const MaintenanceOverlay = () => {
  const active = useUnit($$maintenance.$active)

  if (!active) {
    return null
  }

  return (
    <CenteredLayout className="z-[5000] bg-[color:var(--mantine-color-body)]">
      <div className="flex flex-col items-center gap-8 max-w-[320px]">
        <Loader size="xl" />
        <Text className="text-center" size="lg" lh="xs">
          Начинаются технические работы, следите за&nbsp;обновлениями
          в&nbsp;нашем Telegram&nbsp;канале:{' '}
          <Anchor href="https://t.me/SigmaGamesFeed">@SigmaGamesFeed</Anchor>
        </Text>
      </div>
    </CenteredLayout>
  )
}
