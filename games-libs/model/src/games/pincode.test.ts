import { describe, expect, test } from 'vitest'
import { __ } from './pincode'

const { config } = __

describe('Pincode Model', () => {
  test('Hardcore RTP is correct', () => {
    const multiplierSum = Object.values(config.hardcore.multiplierMap).reduce(
      (acc: number, value?: number) => acc + (value ?? 0),
      0,
    )

    expect(multiplierSum).toBe(9500)
  })
})
