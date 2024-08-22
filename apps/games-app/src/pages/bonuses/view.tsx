import { WithError } from '@core/ui'
import { Button, Card, TextInput } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$bonusesPage } from './model.ts'

export const BonusesPageView = () => {
  const code = useUnit($$bonusesPage.promocodeFields.code.$value)
  const updateCode = useUnit($$bonusesPage.promocodeFields.code.update)

  const submit = useUnit($$bonusesPage.promocodeForm.submit)
  const errors = useUnit($$bonusesPage.promocodeForm.$errors)

  const applyingPromocode = useUnit($$bonusesPage.$applyingPromocode)

  return (
    <Card
      component="form"
      className="lg:max-w-[360px] p-4 rounded-xl md:p-6 md:rounded-2xl"
      style={{ gap: 'var(--mantine-spacing-md)' }}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <h3 className="text-xl font-medium leading-none">Активация промокода</h3>

      <WithError error={errors.code[0]} position="right">
        <TextInput
          classNames={{
            input: 'tracking-widest font-medium',
            label: 'text-sm',
          }}
          label="Введите код"
          size="md"
          placeholder="SIGMA GAMES"
          value={code}
          onChange={(event) => updateCode(event.target.value)}
          error={errors.code[0]}
          spellCheck={false}
        />
      </WithError>

      <Button type="submit" disabled={applyingPromocode} fullWidth={true}>
        Активировать
      </Button>
    </Card>
  )
}
