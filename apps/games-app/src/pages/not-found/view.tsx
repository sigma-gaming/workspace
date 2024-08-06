import { Icons, LinkAnchor } from '@core/ui'
import { Text } from '@mantine/core'
import { CenteredLayout } from '../../layouts/centered'
import { routes } from '../../routing'

export const NotFoundPageView = () => {
  return (
    <CenteredLayout>
      <div className="flex flex-col items-center gap-4 max-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          <Icons.NotFound color="orange" width={128} height={128} />
          <h1 className="text-2xl font-medium text-center">
            Упс! Здесь ничего нет
          </h1>
        </div>
        <Text className="text-center" size="md" lh="md">
          <LinkAnchor to={routes.games}>Вернуться на главную</LinkAnchor>
        </Text>
      </div>
    </CenteredLayout>
  )
}
