import { Icons } from '@core/ui'
import { Radio, Skeleton } from '@mantine/core'
import { useUnit } from 'effector-react'
import { memo, ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
import { DepositMethod, WithdrawalMethod } from '../../../shared/api/core'
import {
  $depositConfigsLoaded,
  $methods,
  $operation,
  $withdrawalConfigsLoaded,
  fields,
} from '../model/form'
import styles from './method-select.module.css'

const depositMethodLabelMap: Record<DepositMethod, string> = {
  [DepositMethod.Crypto]: 'Криптовалюты',
}

const depositMethodIconMap: Record<DepositMethod, ReactNode> = {
  [DepositMethod.Crypto]: <Icons.TonSymbol className="text-white size-4" />,
}

const depositMethodColorMap: Record<DepositMethod, string> = {
  [DepositMethod.Crypto]: '#0098E9',
}

const withdrawalMethodLabelMap: Record<WithdrawalMethod, string> = {
  [DepositMethod.Crypto]: 'Криптовалюты',
}

const withdrawalMethodIconMap: Record<WithdrawalMethod, ReactNode> = {
  [DepositMethod.Crypto]: <Icons.TonSymbol className="text-white size-4" />,
}

const withdrawalMethodColorMap: Record<WithdrawalMethod, string> = {
  [DepositMethod.Crypto]: '#0098E9',
}

export const MethodSelect = memo(() => {
  const depositConfigsLoaded = useUnit($depositConfigsLoaded)
  const withdrawalConfigsLoaded = useUnit($withdrawalConfigsLoaded)
  const configsLoaded = depositConfigsLoaded && withdrawalConfigsLoaded
  const operation = useUnit($operation)
  const methods = useUnit($methods)
  const selectedMethod = useUnit(fields.method.$value)
  const methodListOuterRef = useRef<HTMLDivElement>(null)
  const methodListRef = useRef<HTMLDivElement>(null)

  const getMethodLabel = (method: DepositMethod | WithdrawalMethod) => {
    const labelMap =
      operation === 'deposit' ? depositMethodLabelMap : withdrawalMethodLabelMap
    return labelMap[method as keyof typeof labelMap]
  }

  const getMethodIcon = (method: DepositMethod | WithdrawalMethod) => {
    const iconMap =
      operation === 'deposit' ? depositMethodIconMap : withdrawalMethodIconMap
    return iconMap[method as keyof typeof iconMap]
  }

  const getMethodColor = (method: DepositMethod | WithdrawalMethod) => {
    const colorMap =
      operation === 'deposit' ? depositMethodColorMap : withdrawalMethodColorMap
    return colorMap[method as keyof typeof colorMap]
  }

  const handleMethodListScroll = () => {
    const methodListOuter = methodListOuterRef.current
    const methodList = methodListRef.current
    if (!methodListOuter || !methodList) return

    const isOnTop = methodList.scrollTop === 0
    const isOnBottom =
      methodList.scrollTop + methodList.offsetHeight === methodList.scrollHeight
    methodListOuter.dataset.topShadow = String(!isOnTop)
    methodListOuter.dataset.bottomShadow = String(!isOnBottom)
  }

  useLayoutEffect(() => {
    if (methods.length === 0) return
    handleMethodListScroll()
  }, [methods])

  useEffect(() => {
    if (!selectedMethod) return
    const methodList = methodListRef.current
    if (!methodList) return
    const selector = `[data-value="${selectedMethod}"]`
    const card = methodList.querySelector<HTMLButtonElement>(selector)
    if (!card) return
    methodList.scrollTop = card.offsetTop - methodList.offsetTop
  }, [selectedMethod])

  return (
    <Radio.Group
      label={'Способ ' + (operation === 'deposit' ? 'пополнения' : 'вывода')}
      value={selectedMethod ? String(selectedMethod) : null}
      onChange={(value) => fields.method.update(value as DepositMethod)}
    >
      <div ref={methodListOuterRef} className={styles.methodListOuter}>
        <div
          ref={methodListRef}
          className={styles.methodList}
          onScroll={handleMethodListScroll}
          data-scrollable={configsLoaded}
        >
          {configsLoaded &&
            methods.map((method) => {
              const selected = method === selectedMethod

              return (
                <Radio.Card
                  key={method}
                  className={styles.methodCard}
                  value={String(method)}
                  data-value={method}
                >
                  <div className={styles.methodCardInner}>
                    <div
                      className={styles.methodIcon}
                      style={{ backgroundColor: getMethodColor(method) }}
                      data-selected={selected}
                    >
                      {getMethodIcon(method)}
                    </div>
                    <div className="pr-1">
                      <p className={styles.methodLabel}>
                        {getMethodLabel(method)}
                      </p>
                    </div>
                  </div>
                </Radio.Card>
              )
            })}

          {!configsLoaded &&
            Array.from({ length: 4 }, (_, index) => {
              return (
                <Skeleton
                  key={'skeleton-' + index}
                  className={styles.methodSkeleton}
                />
              )
            })}
        </div>
      </div>
    </Radio.Group>
  )
})
