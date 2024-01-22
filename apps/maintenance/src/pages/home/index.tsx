import { Anchor, rem, Text, Title } from '@mantine/core'
import {
  IconAlertCircle,
  IconAlertOctagon,
  IconAlertTriangle, IconBarrierBlock, IconTrafficCone
} from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import { CenteredLayout } from '../../layouts/centered'

export const HomePageView = () => {
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
          Подробную информацию вы&nbsp;можете получить в&nbsp;нашем{' '}
          <Anchor href="https://t.me/SigmaGamesFeed">
            Telegram&nbsp;канале
          </Anchor>
        </Text>
      </div>
    </CenteredLayout>
  )
}
