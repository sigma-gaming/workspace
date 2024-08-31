import { Icons, WithError } from '@core/ui'
import { Button, Card, TextInput, Tooltip } from '@mantine/core'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import bonusChestSrc from '../assets/bonus-chest-512.webp'
import { $$bonusesPage } from '../model.ts'
import promocodeInputStyles from '../promocode-input.module.css'

export const PromocodeCard = () => {
  const code = useUnit($$bonusesPage.promocodeFields.code.$value)
  const updateCode = useUnit($$bonusesPage.promocodeFields.code.update)

  const submit = useUnit($$bonusesPage.promocodeForm.submit)
  const errors = useUnit($$bonusesPage.promocodeForm.$errors)

  const applyingPromocode = useUnit($$bonusesPage.$applyingPromocode)

  return (
    <Card
      component="form"
      className="relative px-4 py-6 rounded-2xl md:px-6 md:py-8 md:rounded-3xl"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="absolute inset-0">
        <div
          className={clsx(
            'absolute -right-24 -bottom-3 h-full aspect-square',
            'sm:right-0 sm:bottom-0',
            'md:-right-24 md:-bottom-4',
            'lg:bottom-0',
            '2xl:-right-8',
          )}
        >
          <div
            className="absolute left-1/2 top-1/2 rounded-full opacity-25"
            style={{
              boxShadow:
                '#8a39d0 0px 0px 50px 75px, #8a39d0 0px 0px 150px 75px',
            }}
          />
          <img
            className={clsx('relative z-10 w-full h-full')}
            src={bonusChestSrc}
            alt="Glowing Bonus Chest"
          />
        </div>
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(to right, rgba(27, 28, 47, 1) 0%, rgba(27, 28, 47, 0.75) 60%, rgba(27, 28, 47, 0) 80%, rgba(27, 28, 47, 0) 100%)',
          }}
        />
      </div>

      <div className="relative z-10">
        <h3 className="text-2xl font-medium leading-tight">Промокод</h3>

        <p className="mt-2 max-w-[360px] leading-snug">
          Бесплатные&nbsp;гемы или&nbsp;бонус к&nbsp;пополнению&nbsp;баланса
        </p>

        <WithError error={errors.code[0]} position="bottom">
          <TextInput
            classNames={promocodeInputStyles}
            size="lg"
            placeholder="SIGMA GAMES"
            value={code}
            onChange={(event) => updateCode(event.target.value)}
            error={errors.code[0]}
            spellCheck={false}
            radius="lg"
            rightSection={
              <Button
                className="w-full h-full"
                radius={12}
                type="submit"
                disabled={applyingPromocode}
              >
                Применить
              </Button>
            }
          />
        </WithError>

        <div className="mt-4 flex gap-2 items-center select-none">
          <p className="text-sm text-dimmed">Где найти промокоды?</p>
          <Tooltip
            label="Они часто появляются в нашем Telegram-канале, а также в видео и постах партнёров"
            position="bottom"
            multiline
            className="max-w-[250px]"
          >
            <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
          </Tooltip>
        </div>
      </div>
    </Card>
  )
}
