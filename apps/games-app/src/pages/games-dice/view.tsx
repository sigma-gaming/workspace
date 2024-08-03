import { useUnit } from 'effector-react'
import { memo } from 'react'
import { Ping } from '../../features/ping'
import { GamePlaygroundLayout } from '../../layouts/game-playground/view.tsx'
import { $$dicePage } from './model.ts'
import { AnimatedDice } from './ui/animated-dice.tsx'
import { BetField } from './ui/field-bet.tsx'
import { SidesField } from './ui/field-sides.tsx'
import { FormActions } from './ui/form-actions.tsx'
import { PossibleWinAmount } from './ui/possible-win-amount.tsx'

export const DiceGamePageView = memo(() => {
  const loaded = useUnit($$dicePage.$animationLoaded)

  return (
    <GamePlaygroundLayout
      title="Dice"
      onSubmit={() => $$dicePage.playPressed()}
      animationZone={<AnimatedDice />}
      controlsZone={<Ping />}
      loading={!loaded}
      formZone={
        <>
          <BetField />
          <SidesField />
          <PossibleWinAmount />
          <FormActions />
        </>
      }
    />
  )
})
