import { GemInput, Icons, useMedia } from '@core/ui'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { Button, Modal, Radio, SegmentedControl, Select } from '@mantine/core'
import { IconCreditCardFilled } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { memo, ReactNode, useEffect, useRef } from 'react'
import {
  $currencies,
  $currencyConfig,
  $methods,
  $operation,
  $providers,
  depositMutation,
  fields,
  form,
  Operation,
  operationChanged,
  withdrawMutation,
} from './model/form'
import { $opened, close } from './model/modal'
import styles from './styles.module.css'

const currencyLabelMap: Record<Currency, string> = {
  RUB: 'Рубль',
  KZT: 'Тенге',
  USD: 'Доллар',
  EUR: 'Евро',
  TRX: 'TRX',
  USDT_TRC20: 'USDT (TRC20)',
  USDT_ERC20: 'USDT (ERC20)',
  BTC: 'BTC',
  LTC: 'LTC',
  TON: 'TON',
  NOT: 'NOT',
  ETH: 'ETH',
  BNB: 'BNB',
  DOGE: 'DOGE',
}

const depositMethodLabelMap: Record<DepositMethod, string> = {
  [DepositMethod.SBP]: 'СБП',
  [DepositMethod.CreditCard]: 'Банковская карта',
  [DepositMethod.Piastrix]: 'Piastrix',
  [DepositMethod.Toncoin]: 'Toncoin',
}

const depositMethodIconMap: Record<DepositMethod, ReactNode> = {
  [DepositMethod.SBP]: <Icons.Sbp />,
  [DepositMethod.CreditCard]: <IconCreditCardFilled className="text-white" />,
  [DepositMethod.Piastrix]: <Icons.Piastrix className="text-white" />,
  [DepositMethod.Toncoin]: <Icons.TonSymbol className="text-white size-4" />,
}

const depositMethodColorMap: Record<DepositMethod, string> = {
  [DepositMethod.SBP]: '#ffffff',
  [DepositMethod.CreditCard]: '#2171a1',
  [DepositMethod.Piastrix]: '#F54282',
  [DepositMethod.Toncoin]: '#0098E9',
}

const withdrawalMethodLabelMap: Record<WithdrawalMethod, string> = {
  [WithdrawalMethod.SBP]: 'СБП',
  [WithdrawalMethod.CreditCard]: 'Банковская карта',
  [WithdrawalMethod.Piastrix]: 'Piastrix',
}

const withdrawalMethodIconMap: Record<WithdrawalMethod, ReactNode> = {
  [WithdrawalMethod.SBP]: <Icons.Sbp />,
  [WithdrawalMethod.CreditCard]: null,
  [WithdrawalMethod.Piastrix]: null,
}

const withdrawalMethodColorMap: Record<WithdrawalMethod, string> = {
  [WithdrawalMethod.SBP]: '#ffffff',
  [WithdrawalMethod.CreditCard]: '#ffffff',
  [WithdrawalMethod.Piastrix]: '#ffffff',
}

export const PaymentModal = memo(() => {
  const opened = useUnit($opened)
  const operation = useUnit($operation)
  const methods = useUnit($methods)
  const providers = useUnit($providers)
  const currencies = useUnit($currencies)
  const amount = useUnit(fields.amount.$value)
  const selectedMethod = useUnit(fields.method.$value)
  const selectedProvider = useUnit(fields.provider.$value)
  const selectedCurrency = useUnit(fields.currency.$value)
  const currencyConfig = useUnit($currencyConfig)
  const methodListOuterRef = useRef<HTMLDivElement>(null)
  const methodListRef = useRef<HTMLDivElement>(null)
  const providerInputRef = useRef<HTMLInputElement>(null)
  const currencyInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const isDesktop = useMedia({ from: 'md' })

  const { pending: depositPending } = useUnit(depositMutation)
  const { pending: withdrawPending } = useUnit(withdrawMutation)
  const pending = depositPending || withdrawPending

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

  const getCurrencyClueWidth = () => {
    if (!currencyConfig) return 12
    const minAmount = currencyConfig.entry.minAmount
    const maxAmount = currencyConfig.entry.maxAmount
    const minAmountLength = formatGem(gemFloat(minAmount)).length
    const maxAmountLength = formatGem(gemFloat(maxAmount)).length
    return (minAmountLength + maxAmountLength) * 8 + 44
  }

  useEffect(() => {
    if (!selectedMethod) return

    for (const input of [providerInputRef, currencyInputRef, amountInputRef]) {
      if (!input.current) continue
      if (input.current.disabled) continue
      input.current.scrollIntoView({ behavior: 'smooth' })
      return
    }
  }, [selectedMethod])

  useEffect(() => {
    const methodListOuter = methodListOuterRef.current
    const methodList = methodListRef.current
    if (!methodListOuter || !methodList) return

    const handler = () => {
      const isOnTop = methodList.scrollTop === 0
      const isOnBottom =
        methodList.scrollTop + methodList.clientHeight ===
        methodList.scrollHeight
      methodListOuter.dataset.topShadow = String(!isOnTop)
      methodListOuter.dataset.bottomShadow = String(!isOnBottom)
    }

    methodList.addEventListener('scroll', handler)
    return () => methodList.removeEventListener('scroll', handler)
  }, [methodListOuterRef, methodListRef])

  return (
    <Modal.Root opened={opened} onClose={close} size="lg" centered>
      <Modal.Overlay />
      <Modal.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.submit()
          }}
          className="grid grid-cols-1 md:grid-cols-2"
        >
          <div>
            <Modal.Header>
              <Modal.Title>Баланс</Modal.Title>
              {!isDesktop && <Modal.CloseButton />}
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-4">
                <SegmentedControl
                  value={operation}
                  onChange={(value) => operationChanged(value as Operation)}
                  data={[
                    {
                      label: 'Пополнение',
                      value: 'deposit' satisfies Operation,
                    },
                    { label: 'Вывод', value: 'withdrawal' satisfies Operation },
                  ]}
                />

                <Radio.Group
                  label={
                    'Способ ' +
                    (operation === 'deposit' ? 'пополнения' : 'вывода')
                  }
                  value={selectedMethod}
                  onChange={(value) =>
                    fields.method.update(value as DepositMethod)
                  }
                >
                  <div
                    ref={methodListOuterRef}
                    className={styles.methodListOuter}
                  >
                    <div ref={methodListRef} className={styles.methodList}>
                      {methods.map(({ method }) => {
                        const selected = method === selectedMethod

                        return (
                          <Radio.Card
                            key={method}
                            className={styles.methodCard}
                            value={method}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={styles.methodIcon}
                                style={{
                                  backgroundColor: getMethodColor(method),
                                }}
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
                    </div>
                  </div>
                </Radio.Group>

                {providers && providers.providers.length > 1 && (
                  <Select
                    ref={providerInputRef}
                    label="Платёжный сервис"
                    placeholder="Выберите платёжный сервис"
                    value={selectedProvider}
                    onChange={(value) =>
                      fields.provider.update(value as PaymentProvider)
                    }
                    data={providers?.providers.map(({ provider }, idx) => ({
                      label: `Вариант #${idx + 1}`,
                      value: provider,
                    }))}
                  />
                )}

                <Select
                  ref={currencyInputRef}
                  label="Валюта"
                  placeholder="Выберите валюту"
                  value={selectedCurrency}
                  onChange={(value) =>
                    fields.currency.update(value as Currency)
                  }
                  disabled={
                    !selectedProvider ||
                    !currencies ||
                    currencies.currencies.length < 2
                  }
                  data={currencies?.currencies.map(({ currency }) => ({
                    label: currencyLabelMap[currency],
                    value: currency,
                  }))}
                />

                <GemInput
                  ref={amountInputRef}
                  classNames={{ section: 'w-fit' }}
                  styles={{
                    input: {
                      paddingRight: getCurrencyClueWidth(),
                    },
                  }}
                  label={
                    'Сумма гемов к ' +
                    (operation === 'deposit' ? 'пополнению' : 'выводу')
                  }
                  placeholder="Введите сумму"
                  value={amount}
                  onChange={(value) => fields.amount.update(value)}
                  min={currencyConfig?.entry.minAmount}
                  max={currencyConfig?.entry.maxAmount}
                  disabled={!selectedCurrency}
                  rightSection={
                    currencyConfig && (
                      <p className="px-2 text-sm opacity-65">
                        {formatGem(gemFloat(currencyConfig.entry.minAmount))}g -{' '}
                        {formatGem(gemFloat(currencyConfig.entry.maxAmount))}g
                      </p>
                    )
                  }
                />
              </div>
            </Modal.Body>
          </div>
          <div className="flex flex-col rounded-2xl bg-[#25273e]">
            <Modal.Header className="bg-[#25273e]">
              <Modal.Title>
                {operation === 'deposit' ? 'Пополнение' : 'Вывод'}
              </Modal.Title>
              {isDesktop && <Modal.CloseButton />}
            </Modal.Header>
            <Modal.Body className="grow flex flex-col">
              <div className="grow flex flex-col gap-4">
                <Button type="submit" loading={pending} className="mt-auto">
                  Продолжить
                </Button>
              </div>
            </Modal.Body>
          </div>
        </form>
      </Modal.Content>
    </Modal.Root>
  )
})
