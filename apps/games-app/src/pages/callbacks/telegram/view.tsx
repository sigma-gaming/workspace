import { LoadingOverlay } from '@mantine/core'
import { BaseLayout } from '../../../layouts/base'

export const TelegramCallbackPageView = () => {
  return (
    <BaseLayout>
      <LoadingOverlay visible={true} loaderProps={{ size: 'xl' }} />
    </BaseLayout>
  )
}
