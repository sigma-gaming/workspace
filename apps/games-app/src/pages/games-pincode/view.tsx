import { Title } from '@mantine/core'
import { memo } from 'react'
import { $$pincodePage } from './model.ts'
import { AnimatedPincode } from './ui/animated-pincode.tsx'
import { BetField } from './ui/field-bet.tsx'
import { FormActions } from './ui/form-actions.tsx'

export const PincodeGamePageView = memo(() => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        $$pincodePage.playPressed()
      }}
    >
      <Title className="mb-4" order={3}>
        Pincode
      </Title>

      <div className="flex flex-col xl:flex-row-reverse gap-4">
        <div className="relative grow flex flex-col justify-between xl:max-w-[calc(100%-256px)] overflow-hidden rounded-lg">
          <AnimatedPincode />
        </div>

        <div className="flex flex-col gap-4 xl:w-[240px] xl:shrink-0">
          <BetField />
          <FormActions />
        </div>
      </div>
    </form>
  )
})
