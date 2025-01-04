import { Anchor, rem, Text } from '@mantine/core'
import { IconBarrierBlock } from '@tabler/icons-react'
import { useEffect } from 'react'
import { CenteredLayout } from '../../layouts/centered'

export const HomePageView = () => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.location.reload()
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <CenteredLayout>
      <div className="flex flex-col items-center gap-8 max-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          <IconBarrierBlock
            color="orange"
            style={{ width: rem(96), height: rem(96) }}
          />
          <h1 className="text-2xl font-medium text-center">
            Выполняются технические работы
          </h1>
        </div>
        <Text className="text-center" size="md" lh="md">
          Следите за&nbsp;обновлениями в&nbsp;нашем Telegram&nbsp;канале:{' '}
          <Anchor href="https://t.me/SigmaGamesFeed">@SigmaGamesFeed</Anchor>
        </Text>
      </div>
    </CenteredLayout>
  )
}
