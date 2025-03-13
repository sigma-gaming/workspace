import { GemInput, WithError } from '@core/ui'
import {
  ActionIcon,
  Button,
  Card,
  CopyButton,
  LoadingOverlay,
  NumberInput,
  Select,
  Switch,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconRepeat } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { useEffect, useRef } from 'react'
import { PromocodeBonusType } from '../../shared/api/control'
import { $$promocodesPage } from './model'

const { form, fields } = $$promocodesPage

export const PromocodesPageView = () => {
  const campaign = useUnit(fields.campaign.$value)
  const updateCampaign = useUnit(fields.campaign.update)
  const count = useUnit(fields.count.$value)
  const updateCount = useUnit(fields.count.update)
  const code = useUnit(fields.code.$value)
  const updateCode = useUnit(fields.code.update)
  const bonusType = useUnit(fields.bonusType.$value)
  const updateBonusType = useUnit(fields.bonusType.update)
  const payout = useUnit(fields.payout.$value)
  const updatePayout = useUnit(fields.payout.update)
  const wageringMultiplier = useUnit(fields.wageringMultiplier.$value)
  const updateWageringMultiplier = useUnit(fields.wageringMultiplier.update)
  const maxUsages = useUnit(fields.maxUsages.$value)
  const updateMaxUsages = useUnit(fields.maxUsages.update)
  const isActive = useUnit(fields.isActive.$value)
  const updateIsActive = useUnit(fields.isActive.update)
  const expiresAt = useUnit(fields.expiresAt.$value)
  const updateExpiresAt = useUnit(fields.expiresAt.update)
  const userId = useUnit(fields.userId.$value)
  const updateUserId = useUnit(fields.userId.update)
  const generatePromocode = useUnit($$promocodesPage.generatePromocode)
  const generatingPromocode = useUnit($$promocodesPage.$generatingPromocode)
  const createdCodes = useUnit($$promocodesPage.$createdCodes)
  const createdCodesRef = useRef<HTMLDivElement>(null)

  const submit = useUnit(form.submit)
  const errors = useUnit(form.$errors)
  const submitting = useUnit($$promocodesPage.$submitting)

  const bonusTypeOptions: Array<{ label: string; value: PromocodeBonusType }> =
    [{ label: 'Мгновенная выплата', value: PromocodeBonusType.Payout }]

  useEffect(() => {
    if (createdCodes.length === 0) return
    const codes = createdCodesRef.current
    if (!codes) return
    codes.scrollIntoView({ behavior: 'smooth' })
  }, [createdCodes])

  return (
    <Card
      component="form"
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      style={{ gap: 'var(--mantine-spacing-md)' }}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <LoadingOverlay visible={submitting} />

      <h3 className="text-xl font-medium">Новый промокод</h3>

      <WithError error={errors.campaign[0]}>
        <TextInput
          label="Рекламная кампания"
          placeholder="Введите название"
          description="Понятное название рекламной кампании облегчит поиск промокода в будущем"
          value={campaign}
          onChange={(event) => updateCampaign(event.target.value)}
          error={errors.campaign[0]}
        />
      </WithError>

      <WithError error={errors.count[0]}>
        <NumberInput
          label="Количество промокодов"
          placeholder="Введите количество"
          description="При создании нескольких промокодов, их коды генерируются автоматически"
          value={count}
          onChange={(value) => updateCount(Number(value))}
          allowDecimal={false}
          min={1}
          error={errors.count[0]}
        />
      </WithError>

      {count < 2 && (
        <WithError error={errors.code[0]}>
          <TextInput
            label="Код"
            placeholder="Введите код"
            value={code}
            onChange={(event) => updateCode(event.target.value)}
            error={errors.code[0]}
            rightSectionPointerEvents="all"
            rightSection={
              <Tooltip
                label="Сгенерировать промокод"
                className="text-sm px-2 py-1"
              >
                <ActionIcon
                  size={28}
                  radius="sm"
                  variant="subtle"
                  color="var(--mantine-color-dimmed)"
                  className="hover:bg-white/5"
                  onClick={() => generatePromocode()}
                  loading={generatingPromocode}
                >
                  <IconRepeat width={18} height={18} />
                </ActionIcon>
              </Tooltip>
            }
          />
        </WithError>
      )}

      <WithError error={errors.bonusType[0]}>
        <Select
          label="Тип бонуса"
          data={bonusTypeOptions}
          value={bonusType}
          onChange={(color) => updateBonusType(color as PromocodeBonusType)}
          allowDeselect={false}
          error={errors.bonusType[0]}
        />
      </WithError>

      {bonusType === PromocodeBonusType.Payout && (
        <WithError error={errors.payout[0]}>
          <GemInput
            label="Выплата"
            placeholder="Введите количество гемов"
            description="На столько гемов будет пополнен счёт при вводе промокода"
            value={payout}
            onChange={(value) => updatePayout(value)}
            error={errors.payout[0]}
          />
        </WithError>
      )}

      <WithError error={errors.wageringMultiplier[0]}>
        <NumberInput
          label="Множитель вагеринга"
          placeholder="Введите число"
          value={wageringMultiplier}
          onChange={(value) => updateWageringMultiplier(Number(value))}
          allowDecimal={false}
          min={1}
          error={errors.count[0]}
        />
      </WithError>

      <Switch
        checked={isActive}
        onChange={(event) => updateIsActive(event.target.checked)}
        label={count > 1 ? 'Промокоды активны' : 'Промокод активен'}
        error={errors.isActive[0]}
      />

      <WithError error={errors.maxUsages[0]}>
        <NumberInput
          label="Количество использований"
          placeholder="Введите число"
          value={maxUsages}
          onChange={(value) => updateMaxUsages(Number(value))}
          allowDecimal={false}
          min={1}
          error={errors.maxUsages[0]}
        />
      </WithError>

      <WithError error={errors.expiresAt[0]}>
        <DateTimePicker
          label="Дата истечения"
          value={new Date(expiresAt)}
          valueFormat="DD MMM YYYY HH:mm (по мск)"
          onChange={(value) => {
            if (!value) return
            updateExpiresAt(value.toISOString())
          }}
          error={errors.expiresAt[0]}
        />
      </WithError>

      <WithError error={errors.userId[0]}>
        <TextInput
          label="ID пользователя (опционально)"
          placeholder="Введите UUID"
          description="Если указать ID пользователя, только он сможет ввести промокод"
          value={userId}
          onChange={(event) => updateUserId(event.target.value)}
          error={errors.userId[0]}
        />
      </WithError>

      <Button
        type="submit"
        disabled={submitting}
        loading={submitting}
        fullWidth={true}
      >
        Создать {count > 1 ? 'промокоды' : 'промокод'}
      </Button>

      {createdCodes.length > 0 && (
        <div
          ref={createdCodesRef}
          className="py-3 px-4 bg-green-700 bg-opacity-25 border-2 border-dashed border-green-400 border-opacity-50 rounded-md"
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center justify-between mb-4">
            <h4 className="text-base font-medium leading-tight">
              Сгенерированные промокоды
            </h4>
            <CopyButton value={createdCodes.join('\n')}>
              {({ copied, copy }) => (
                <Button
                  className="-mr-1 shrink-0"
                  size="xs"
                  color={copied ? 'teal' : 'blue'}
                  onClick={copy}
                >
                  {copied ? 'Скопировано' : 'Скопировать'}
                </Button>
              )}
            </CopyButton>
          </div>

          <ul className="flex flex-wrap">
            {createdCodes.map((code) => (
              <li key={code} className="min-w-[120px]">
                {code}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
