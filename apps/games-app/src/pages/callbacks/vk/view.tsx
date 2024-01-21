import { Loader, Text } from '@mantine/core'
import { CenteredLayout } from '../../../layouts/centered'

export const VkCallbackPageView = () => {
  return (
    <CenteredLayout>
      <div className="flex flex-col items-center gap-8">
        <Loader size="xl" />
        <Text className="text-center" size="lg" lh="xs">
          Выполняется вход через&nbsp;VK
        </Text>
      </div>
    </CenteredLayout>
  )
}
