import { CenteredLayout } from '../../../layouts/centered'
import { createPage, routes } from '../../../routing'
import { PaymentSuccessPageView } from './view.tsx'

export const PaymentSuccessCallbackPage = createPage({
  title: 'Успешное пополнение',
  route: routes.paymentSuccessCallback,
  view: PaymentSuccessPageView,
  layout: CenteredLayout,
})
