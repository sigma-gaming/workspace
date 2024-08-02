import { FlipOptions } from '@floating-ui/react'

export function createFlipOptions(options: FlipOptions = {}): FlipOptions {
  return {
    padding: { top: 72, bottom: 64, left: 16, right: 16 },
    fallbackPlacements: ['top', 'right', 'bottom'],
    ...options,
  }
}
