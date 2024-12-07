import { sample } from 'effector'
import { condition } from 'patronum'
import { operationChanged } from './form'
import { $opened, openDeposit, openWithdraw } from './modal'
import { destroy, initialize } from './shared'

sample({
  clock: openDeposit,
  target: operationChanged.prepend(() => 'deposit'),
})

sample({
  clock: openWithdraw,
  target: operationChanged.prepend(() => 'withdrawal'),
})

condition({
  source: $opened,
  if: Boolean,
  then: initialize,
  else: destroy,
})

openDeposit()
