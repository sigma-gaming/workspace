import { useMedia } from '@core/ui'
import { Modal } from '@mantine/core'
import { IconCoins, IconWallet } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { memo } from 'react'
import { $operation } from './model/form'
import { $opened, close } from './model/modal'

export const PaymentModal = memo(() => {
  const opened = useUnit($opened)
  const operation = useUnit($operation)
  const isDesktop = useMedia({ from: 'md' })

  return (
    <Modal.Root opened={opened} onClose={close} size="lg" centered>
      <Modal.Overlay />
      <Modal.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            // form.submit()
          }}
          className="grid grid-cols-1 md:grid-cols-2"
        >
          <div>
            <Modal.Header>
              <Modal.Title>Платежи</Modal.Title>
              {!isDesktop && <Modal.CloseButton />}
            </Modal.Header>
            <Modal.Body>{/* <FormStart /> */}</Modal.Body>
          </div>
          <div className="relative flex flex-col rounded-2xl bg-[#25273e]">
            <Modal.Header className="bg-[#25273e]">
              <Modal.Title className="flex items-center gap-2">
                {operation === 'deposit' ? (
                  <IconWallet className="size-6" />
                ) : (
                  <IconCoins className="size-6" />
                )}
                {operation === 'deposit' ? 'Пополнение' : 'Вывод'}
              </Modal.Title>
              {isDesktop && <Modal.CloseButton />}
            </Modal.Header>
            <Modal.Body className="mt-auto md:sticky bottom-0 flex flex-col">
              {/* <FormFinish /> */}
            </Modal.Body>
          </div>
        </form>
      </Modal.Content>
    </Modal.Root>
  )
})

// const FormStart = memo(() => {
//   const currencyInputRef = useRef<HTMLInputElement>(null)
//   const providerInputRef = useRef<HTMLInputElement>(null)
//   const amountInputRef = useRef<HTMLInputElement>(null)
//   const selectedMethod = useUnit(fields.method.$value)

//   useEffect(() => {
//     if (!selectedMethod) return

//     for (const input of [currencyInputRef, providerInputRef]) {
//       if (!input.current) continue
//       if (input.current.disabled) continue
//       input.current.scrollIntoView({ behavior: 'smooth' })
//       return
//     }

//     const amountInput = amountInputRef.current
//     if (!amountInput) return
//     amountInput.scrollIntoView({ behavior: 'smooth' })
//   }, [selectedMethod])

//   return (
//     <div className="flex flex-col gap-4">
//       <OperationControl />
//       <MethodSelect />
//       <CurrencySelect ref={currencyInputRef} />
//       <ProviderSelect ref={providerInputRef} />
//       <AmountInput ref={amountInputRef} />
//       <CorrectedAmount />
//     </div>
//   )
// })

// const FormFinish = memo(() => {
// const requiredFieldsFilled = useUnit($requiredFieldsFilled)
// const { pending: depositPending } = useUnit(depositMutation)
// const { pending: withdrawPending } = useUnit(withdrawMutation)
// const pending = depositPending || withdrawPending

//   return (
//     <div className="grow flex flex-col gap-4 justify-end">
//       <TotalAmount />
//       <Button type="submit" loading={pending} disabled={!requiredFieldsFilled}>
//         Продолжить
//       </Button>
//     </div>
//   )
// })
