import { Button, Card, MultiSelect, NumberInput, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { BaseLayout } from '../../../layouts/base'
import { $$dicesPage } from './model.ts'

export const DicesGamePageView = () => {
  const bet = useUnit($$dicesPage.fields.bet.$value)
  const sides = useUnit($$dicesPage.fields.sides.$value)
  const errors = useUnit($$dicesPage.form.$errors)
  const playing = useUnit($$dicesPage.$playing)
  const autoplaying = useUnit($$dicesPage.$autoplaying)

  return (
    <BaseLayout>
      <Card
        component="form"
        className="p-4 rounded-xl md:p-6 md:rounded-2xl"
        style={{ gap: 'var(--mantine-spacing-md)' }}
        onSubmit={(event) => {
          event.preventDefault()
          $$dicesPage.startPlay()
        }}
      >
        <Title order={3}>Dices</Title>

        <NumberInput
          label="Ставка"
          value={bet}
          onChange={(value) => $$dicesPage.fields.bet.update(Number(value))}
          error={errors.bet[0]}
          min={1}
          decimalScale={2}
        />

        <MultiSelect
          label="Грани"
          data={[
            { label: '1', value: '1' },
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
            { label: '5', value: '5' },
            { label: '6', value: '6' },
          ]}
          value={sides}
          onChange={(sides) => $$dicesPage.fields.sides.update(sides)}
          error={errors.sides[0]}
        />

        <Button type="submit" disabled={playing} fullWidth={true}>
          Играть
        </Button>
        <Button onClick={() => $$dicesPage.autoplayToggled()} fullWidth={true}>
          {autoplaying ? 'Остановить' : 'Автоигра'}
        </Button>
      </Card>
    </BaseLayout>
  )
}
