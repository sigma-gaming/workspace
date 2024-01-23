import { Loader, Text } from '@mantine/core'

export const VkCallbackPageView = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <Loader size="xl" />
      <Text className="text-center" size="lg" lh="xs">
        Выполняется вход через&nbsp;VK
      </Text>
    </div>
  )
}
