import { GemInput, Icons, useMedia } from '@core/ui'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import {
  ActionIcon,
  Button,
  Modal,
  Radio,
  SegmentedControl,
  Select,
  Skeleton,
  Tooltip,
} from '@mantine/core'
import { IconCreditCardFilled, IconRefresh } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { memo, ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
import {
  $configLoaded,
  $correctedAmount,
  $currencies,
  $currencyConfig,
  $methods,
  $operation,
  $providerConfig,
  $providers,
  $totalAmount,
  amountCorrectionRequested,
  depositMutation,
  fields,
  form,
  Operation,
  operationChanged,
  refreshCorrectionAmount,
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

const formatters = {
  [Currency.RUB]: new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }),
}

const currencyFormatterMap: Record<Currency, (value: number) => string> = {
  [Currency.RUB]: (value) => formatters[Currency.RUB].format(value),
  [Currency.KZT]: (value) => value.toFixed(2),
  [Currency.USD]: (value) => value.toFixed(2),
  [Currency.EUR]: (value) => value.toFixed(2),
  [Currency.TRX]: (value) => value.toFixed(2),
  [Currency.USDT_TRC20]: (value) => value.toFixed(2),
  [Currency.USDT_ERC20]: (value) => value.toFixed(2),
  [Currency.BTC]: (value) => value.toFixed(8),
  [Currency.LTC]: (value) => value.toFixed(8),
  [Currency.TON]: (value) => value.toFixed(8),
  [Currency.NOT]: (value) => value.toFixed(8),
  [Currency.ETH]: (value) => value.toFixed(8),
  [Currency.BNB]: (value) => value.toFixed(8),
  [Currency.DOGE]: (value) => value.toFixed(8),
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
  const configLoaded = useUnit($configLoaded)
  const methods = useUnit($methods)
  const currencies = useUnit($currencies)
  const providers = useUnit($providers)
  const amount = useUnit(fields.amount.$value)
  const correctedAmount = useUnit($correctedAmount)
  const totalAmount = useUnit($totalAmount)
  const selectedMethod = useUnit(fields.method.$value)
  const selectedCurrency = useUnit(fields.currency.$value)
  const selectedProvider = useUnit(fields.provider.$value)
  const currencyConfig = useUnit($currencyConfig)
  const providerConfig = useUnit($providerConfig)
  const methodListOuterRef = useRef<HTMLDivElement>(null)
  const methodListRef = useRef<HTMLDivElement>(null)
  const currencyInputRef = useRef<HTMLInputElement>(null)
  const providerInputRef = useRef<HTMLInputElement>(null)
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
    if (!providerConfig) return 12
    const minAmount = providerConfig.entry.minAmount
    const maxAmount = providerConfig.entry.maxAmount
    const minAmountLength = formatGem(gemFloat(minAmount)).length
    const maxAmountLength = formatGem(gemFloat(maxAmount)).length
    return (minAmountLength + maxAmountLength) * 8 + 44
  }

  useEffect(() => {
    if (!selectedMethod) return

    for (const input of [currencyInputRef, providerInputRef]) {
      if (!input.current) continue
      if (input.current.disabled) continue
      input.current.scrollIntoView({ behavior: 'smooth' })
      return
    }

    const amountInput = amountInputRef.current
    if (!amountInput) return
    amountInput.scrollIntoView({ behavior: 'smooth' })
  }, [selectedMethod])

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
              <Modal.Title>Платежи</Modal.Title>
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
                    <div
                      ref={methodListRef}
                      className={styles.methodList}
                      onScroll={handleMethodListScroll}
                      data-scrollable={configLoaded}
                    >
                      {configLoaded &&
                        methods.map(({ method }) => {
                          const selected = method === selectedMethod

                          return (
                            <Radio.Card
                              key={method}
                              className={styles.methodCard}
                              value={method}
                              data-value={method}
                            >
                              <div className={styles.methodCardInner}>
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

                      {!configLoaded &&
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

                {!currencyConfig?.only && (
                  <Select
                    ref={currencyInputRef}
                    label="Валюта"
                    placeholder="Выберите валюту"
                    description={`В этой валюте будет ${operation === 'deposit' ? 'происходить оплата' : 'сделана выплата'}`}
                    value={selectedCurrency}
                    onChange={(value) =>
                      fields.currency.update(value as Currency)
                    }
                    disabled={!selectedProvider || currencies.length < 2}
                    data={currencies.map(({ currency }) => ({
                      label: currencyLabelMap[currency],
                      value: currency,
                    }))}
                  />
                )}

                {providers.length > 1 && (
                  <Select
                    ref={providerInputRef}
                    label="Платёжный сервис"
                    placeholder="Выберите платёжный сервис"
                    description={`Если не получается ${operation === 'deposit' ? 'пополнить баланс' : 'сделать вывод'}, попробуйте другой вариант`}
                    value={selectedProvider}
                    onChange={(value) =>
                      fields.provider.update(value as PaymentProvider)
                    }
                    data={providers.map(({ provider }, idx) => ({
                      label: `Вариант #${idx + 1}`,
                      value: provider,
                    }))}
                  />
                )}

                <GemInput
                  ref={amountInputRef}
                  classNames={{ section: 'w-fit' }}
                  styles={{
                    input: {
                      paddingLeft: 36,
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
                  onBlur={() => amountCorrectionRequested()}
                  min={providerConfig?.entry.minAmount}
                  max={providerConfig?.entry.maxAmount}
                  disabled={!selectedCurrency}
                  leftSection={
                    <Icons.Gem className="mx-2 size-5 text-primary-400" />
                  }
                  rightSection={
                    providerConfig && (
                      <p className="px-2 text-sm opacity-65">
                        {formatGem(gemFloat(providerConfig.entry.minAmount))}g -{' '}
                        {formatGem(gemFloat(providerConfig.entry.maxAmount))}g
                      </p>
                    )
                  }
                />

                {operation === 'deposit' && (
                  <div className="flex flex-col gap-2">
                    <GemInput
                      ref={amountInputRef}
                      classNames={{
                        section: 'w-fit !opacity-100',
                        input: 'px-9',
                      }}
                      label="Сумма после коррекции"
                      description="К сумме пополнения добавляется до&nbsp;50&nbsp;гемов, чтобы упростить выдачу&nbsp;реквизитов"
                      value={correctedAmount}
                      disabled={true}
                      leftSection={
                        <Icons.Gem className="mx-2 size-5 text-primary-400 opacity-60" />
                      }
                      rightSectionPointerEvents="all"
                      rightSection={
                        <Tooltip label="Обновить сумму" className="text-sm">
                          <ActionIcon
                            size={28}
                            radius="sm"
                            variant="light"
                            className="mr-1 opacity-70 hover:opacity-100 !text-[color:--mantine-color-text] !bg-[#363859] transition-opacity"
                            onClick={() => refreshCorrectionAmount()}
                          >
                            <IconRefresh width={18} height={18} />
                          </ActionIcon>
                        </Tooltip>
                      }
                    />
                    <div className="flex gap-2 items-center select-none">
                      <p className="text-xs lg:text-sm text-dimmed">
                        Зачем это нужно?
                      </p>
                      <Tooltip
                        className="max-w-[250px] leading-snug text-xs"
                        label={
                          <>
                            Люди часто вводят одинаковые круглые суммы
                            при&nbsp;пополнении. Это плохо сказывается
                            на&nbsp;выдаче реквизитов платежными системами,
                            так&nbsp;как один и тот&nbsp;же реквизит
                            не&nbsp;может быть выдан нескольким пользователям
                            с&nbsp;одинаковой суммой платежа. С&nbsp;помощью
                            небольшой случайной коррекции существенно
                            увеличивается скорость выдачи реквизитов
                          </>
                        }
                      >
                        <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
                      </Tooltip>
                    </div>
                  </div>
                )}
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
              <div className="grow flex flex-col gap-4 justify-end">
                {selectedCurrency && (
                  <div>
                    <p className="text-4xl font-[450]">
                      {currencyFormatterMap[selectedCurrency](totalAmount)}
                    </p>
                    <p className="text-sm leading-tight text-dimmed opacity-80">
                      Итоговая сумма с&nbsp;комиссией. Финальная сумма на
                      стороне провайдера может отличаться от&nbsp;показанной
                    </p>
                  </div>
                )}
                <Button type="submit" loading={pending}>
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
