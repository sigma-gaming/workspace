import { rem, Text, Title } from '@mantine/core'
import { IconError404 } from '@tabler/icons-react'
import { CenteredLayout } from '../../layouts/centered'
import { routes } from '../../routing'
import { LinkAnchor } from '../../shared/ui/general/link-anchor'

export const NotFoundPageView = () => {
  return (
    <CenteredLayout>
      <div className="flex flex-col items-center gap-4 max-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          <IconError404
            color="orange"
            style={{ width: rem(128), height: rem(128) }}
          />
          <Title order={2} className="text-center" lh="1.2">
            Упс! Здесь ничего нет
          </Title>
        </div>
        <Text className="text-center" size="lg" lh="md">
          <LinkAnchor to={routes.dashboard}>Вернуться на главную</LinkAnchor>
        </Text>
      </div>
    </CenteredLayout>
  )
}
