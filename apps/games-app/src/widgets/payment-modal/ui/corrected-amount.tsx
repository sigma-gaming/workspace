import { GemInput, Icons } from '@core/ui'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { memo } from 'react'
import {
  $correctedAmount,
  $methodConfig,
  refreshCorrectionAmount,
} from '../model/form'

export const CorrectedAmount = memo(() => {
  const methodConfig = useUnit($methodConfig)
  const correctedAmount = useUnit($correctedAmount)

  if (!methodConfig?.isP2p) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <GemInput
        classNames={{
          section: 'w-fit !opacity-100',
          input: 'px-9',
        }}
        label="Сумма после коррекции"
        description="К сумме пополнения добавляется до&nbsp;50&nbsp;гемов, чтобы упростить выдачу&nbsp;реквизитов"
        value={correctedAmount}
        disabled={true}
        leftSectionPointerEvents="none"
        leftSection={
          <Icons.Gem className="mx-2 size-5 text-primary-400 opacity-60" />
        }
        rightSectionPointerEvents="all"
        rightSection={
          <Tooltip label="Обновить сумму" className="text-sm">
            <ActionIcon
              size={28}
              radius="sm"
              variant="light"
              className="mr-1 opacity-70 hover:opacity-100 !text-[color:--mantine-color-text] !bg-[#363859] transition-opacity"
              onClick={() => refreshCorrectionAmount()}
            >
              <IconRefresh width={18} height={18} />
            </ActionIcon>
          </Tooltip>
        }
      />
      <div className="flex gap-2 items-center select-none">
        <p className="text-xs lg:text-sm text-dimmed">Зачем это нужно?</p>
        <Tooltip
          className="max-w-[250px] leading-snug text-xs"
          label={
            <>
              Люди часто вводят одинаковые круглые суммы при&nbsp;пополнении.
              Это плохо сказывается на&nbsp;выдаче реквизитов платежными
              системами, так&nbsp;как один и тот&nbsp;же реквизит не&nbsp;может
              быть выдан нескольким пользователям с&nbsp;одинаковой суммой
              платежа. С&nbsp;помощью небольшой случайной коррекции существенно
              увеличивается скорость выдачи реквизитов
            </>
          }
        >
          <Icons.Question className="shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
        </Tooltip>
      </div>
    </div>
  )
})
