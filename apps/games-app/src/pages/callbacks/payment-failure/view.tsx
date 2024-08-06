import { Icons, LinkAnchor } from '@core/ui'
import { Text, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { routes } from '../../../routing'
import { $$paymentFailurePage } from './model'

export const PaymentFailurePageView = () => {
  const secondsToRedirect = useUnit($$paymentFailurePage.$secondsToRedirect)

  return (
    <div className="flex flex-col items-center gap-4 max-w-[320px]">
      <div className="flex flex-col items-center gap-4">
        <Icons.Error className="text-red-500" width={128} height={128} />
        <Title order={2} className="text-center" lh="1.2">
          Не удалось пополнить баланс
        </Title>
      </div>
      <Text className="text-center" size="lg" lh="md">
        <LinkAnchor to={routes.games}>
          Вернуться на главную ({secondsToRedirect})
        </LinkAnchor>
      </Text>
    </div>
  )
}
