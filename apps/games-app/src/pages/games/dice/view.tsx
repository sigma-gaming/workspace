import { Card, Title } from '@mantine/core'
import { memo } from 'react'
import { $$dicePage } from './model.ts'
import { AnimatedDice } from './ui/animated-dice.tsx'
import { BetField } from './ui/field-bet.tsx'
import { SidesField } from './ui/field-sides.tsx'
import { FormActions } from './ui/form-actions.tsx'
import { PossibleWinAmount } from './ui/possible-win-amount.tsx'

export const DiceGamePageView = memo(() => {
  return (
    <Card
      component="form"
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        $$dicePage.playPressed()
      }}
    >
      <Title className="mb-4" order={3}>
        Dice
      </Title>

      <div className="flex flex-col xl:flex-row-reverse gap-4">
        <div className="relative grow flex flex-col justify-between xl:max-w-[calc(100%-256px)] overflow-hidden rounded-lg">
          <AnimatedDice />
        </div>

        <div className="flex flex-col gap-4 xl:w-[240px] xl:shrink-0">
          <BetField />
          <SidesField />
          <PossibleWinAmount />
          <FormActions />
        </div>
      </div>
    </Card>
  )
})
