import { Loader, Text } from '@mantine/core'

export const TelegramCallbackPageView = () => {
  return (
    <div className="flex flex-col items-center gap-8 max-w-60 md:max-w-80">
      <Loader size="xl" />
      <Text className="text-center" size="lg" lh="xs">
        Выполняется вход через&nbsp;Telegram
      </Text>
    </div>
  )
}
