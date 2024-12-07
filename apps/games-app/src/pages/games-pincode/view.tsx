import { memo } from 'react'
import { Ping } from '../../features/ping'
import { GamePlaygroundLayout } from '../../layouts/game-playground/view.tsx'
import { $$pincodePage } from './model.ts'
import { AnimatedPincode } from './ui/animated-pincode.tsx'
import { BetField } from './ui/field-bet.tsx'
import { ModeField } from './ui/field-mode.tsx'
import { FormActions } from './ui/form-actions.tsx'
import { MultiplierTable } from './ui/multiplier-table.tsx'

export const PincodeGamePageView = memo(() => {
  return (
    <GamePlaygroundLayout
      title="Pincode"
      onSubmit={() => $$pincodePage.playPressed()}
      animationZone={
        <div className="w-full flex flex-col gap-6 xl:gap-8 xl:flex-col-reverse">
          <MultiplierTable />
          <AnimatedPincode />
        </div>
      }
      controlsZone={<Ping />}
      fieldsZone={
        <>
          <BetField />
          <ModeField />
        </>
      }
      actionsZone={<FormActions />}
    />
  )
})
