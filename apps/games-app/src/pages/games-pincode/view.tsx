import { memo } from 'react'
import { GamePlaygroundLayout } from '../../layouts/game-playground/view.tsx'
import { $$pincodePage } from './model.ts'
import { AnimatedPincode } from './ui/animated-pincode.tsx'
import { BetField } from './ui/field-bet.tsx'
import { HardcoreModeField } from './ui/field-hardcore-mode.tsx'
import { FormActions } from './ui/form-actions.tsx'

export const PincodeGamePageView = memo(() => {
  return (
    <GamePlaygroundLayout
      title="Pincode"
      onSubmit={() => $$pincodePage.playPressed()}
      animation={<AnimatedPincode />}
      fields={
        <>
          <BetField />
          <HardcoreModeField />
          <FormActions />
        </>
      }
    />
  )
})
