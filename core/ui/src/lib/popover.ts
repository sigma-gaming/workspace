import { PopoverMiddlewares } from '@mantine/core/lib/components/Popover/Popover.types'

export function createFlipOptions(
  options: PopoverMiddlewares['flip'] & object = {},
): PopoverMiddlewares['flip'] {
  return {
    padding: { top: 72, bottom: 64, left: 16, right: 16 },
    fallbackPlacements: ['top', 'right', 'bottom'],
    ...options,
  }
}
