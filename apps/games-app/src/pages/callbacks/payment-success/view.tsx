import { LinkAnchor } from '@core/ui'
import { rem, Text } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { routes } from '../../../routing'
import { $$paymentSuccessPage } from './model'

export const PaymentSuccessPageView = () => {
  const secondsToRedirect = useUnit($$paymentSuccessPage.$secondsToRedirect)

  return (
    <div className="flex flex-col items-center gap-4 max-w-[320px]">
      <div className="flex flex-col items-center gap-4">
        <IconCheck
          className="text-green-500"
          style={{ width: rem(128), height: rem(128) }}
        />
        <h1 className="text-2xl font-medium text-center">
          Баланс успешно пополнен
        </h1>
      </div>
      <Text className="text-center" size="md" lh="md">
        <LinkAnchor to={routes.games}>
          Вернуться на главную ({secondsToRedirect})
        </LinkAnchor>
      </Text>
    </div>
  )
}
