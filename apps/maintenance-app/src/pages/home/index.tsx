import { Anchor, rem, Text, Title } from '@mantine/core'
import { IconBarrierBlock } from '@tabler/icons-react'
import { useEffect } from 'react'
import { CenteredLayout } from '../../layouts/centered'

export const HomePageView = () => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      window.location.reload()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <CenteredLayout>
      <div className="flex flex-col items-center gap-8 max-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          <IconBarrierBlock
            color="orange"
            style={{ width: rem(96), height: rem(96) }}
          />
          <Title order={2} className="text-center" lh="1.2">
            Выполняются технические работы
          </Title>
        </div>
        <Text className="text-center" size="lg" lh="md">
          Следите за&nbsp;обновлениями в&nbsp;нашем{' '}
          <Anchor href="https://t.me/SigmaGamesFeed">
            Telegram&nbsp;канале
          </Anchor>
        </Text>
      </div>
    </CenteredLayout>
  )
}
