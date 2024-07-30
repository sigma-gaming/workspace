import { describe, expect, test } from 'vitest'
import { pincodeMultiplierMap } from './pincode'

describe('Pincode Model', () => {
  test('RTP is correct', () => {
    const multiplierSum = Object.values(pincodeMultiplierMap).reduce(
      (acc: number, value?: number) => acc + (value ?? 0),
      0,
    )

    expect(multiplierSum).toBe(9502)
  })
})
