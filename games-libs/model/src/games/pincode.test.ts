import { describe, expect, test } from 'vitest'
import { __, getPincodeMultiplier, PincodeMode } from './pincode'

function calculateTotalMultiplier(mode: PincodeMode) {
  let total = 0

  for (let i = 0; i < 10000; i++) {
    total += getPincodeMultiplier(mode, i)
  }

  return total
}

describe('Pincode Model', () => {
  test('Hardcore RTP is correct', () => {
    const totalMultiplier = calculateTotalMultiplier(PincodeMode.Hardcore)

    expect(totalMultiplier).toBe(9500)
  })

  test('Easy RTP is correct', () => {
    const totalMultiplier = calculateTotalMultiplier(PincodeMode.Easy)

    expect(getPincodeMultiplier(PincodeMode.Easy, 777)).toBe(15)
    expect(getPincodeMultiplier(PincodeMode.Easy, 7077)).toBe(15)
    expect(getPincodeMultiplier(PincodeMode.Easy, 7770)).toBe(15)

    expect(getPincodeMultiplier(PincodeMode.Easy, 555)).toBe(7)
    expect(getPincodeMultiplier(PincodeMode.Easy, 5055)).toBe(7)
    expect(getPincodeMultiplier(PincodeMode.Easy, 5550)).toBe(7)

    expect(getPincodeMultiplier(PincodeMode.Easy, 77)).toBe(3)
    expect(getPincodeMultiplier(PincodeMode.Easy, 707)).toBe(3)
    expect(getPincodeMultiplier(PincodeMode.Easy, 770)).toBe(3)
    expect(getPincodeMultiplier(PincodeMode.Easy, 7007)).toBe(3)
    expect(getPincodeMultiplier(PincodeMode.Easy, 7700)).toBe(3)

    expect(getPincodeMultiplier(PincodeMode.Easy, 99)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 909)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 990)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 9009)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 9900)).toBe(2)

    expect(getPincodeMultiplier(PincodeMode.Easy, 1001)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 1100)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 1010)).toBe(2)
    expect(getPincodeMultiplier(PincodeMode.Easy, 101)).toBe(2)

    expect(totalMultiplier).toBe(9500)
  })
})
