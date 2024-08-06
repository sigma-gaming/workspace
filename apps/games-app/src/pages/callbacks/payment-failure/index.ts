import { CenteredLayout } from '../../../layouts/centered/index.ts'
import { createPage, routes } from '../../../routing/index.ts'
import { PaymentFailurePageView } from './view.tsx'

export const PaymentFailureCallbackPage = createPage({
  title: 'Ошибка пополнения',
  route: routes.paymentFailureCallback,
  view: PaymentFailurePageView,
  layout: CenteredLayout,
})
