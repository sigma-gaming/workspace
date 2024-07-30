/* eslint-disable no-bitwise */
export const pincodeMultiplierMap: Partial<Record<number, number>> = {
  0: 250,
  1111: 250,
  2222: 250,
  3333: 250,
  4444: 250,
  5555: 250,
  6666: 250,
  7777: 1000,
  8888: 250,
  9999: 250,
  1337: 111,
  1488: 111,
}

export const pincodeHighlightMap: Partial<Record<number, number>> = {
  0: 15,
  1111: 15,
  2222: 15,
  3333: 15,
  4444: 15,
  5555: 15,
  6666: 15,
  7777: 15,
  8888: 15,
  9999: 15,
  1337: 15,
  1488: 15,
}

const CODE_LENGTH = 4

function withBit(bitmask: number, index: number) {
  const bit = 1 << (CODE_LENGTH - 1 - index)
  return bitmask | bit
}

function hasBit(bitmask: number, index: number) {
  const bit = 1 << (CODE_LENGTH - 1 - index)
  return (bitmask & bit) !== 0
}

for (let code = 0; code < 10000; code++) {
  let sevenCount = 0
  let highlightBitmask = 0
  const codeString = code.toString().padStart(4, '0')

  for (let i = 0; i < 4; i++) {
    if (codeString[i] === '7') {
      sevenCount += 1
      highlightBitmask = withBit(highlightBitmask, i)
    }
  }

  let multiplier = 0
  if (sevenCount === 2) multiplier = 5
  if (sevenCount === 3) multiplier = 100

  if (multiplier > 0) {
    pincodeMultiplierMap[code] = multiplier
    pincodeHighlightMap[code] = highlightBitmask
  }
}

export function getPincodeMultiplier(code: number) {
  return pincodeMultiplierMap[code] ?? 0
}

export function getPincodeHighlight(code: number) {
  const bitmask = pincodeHighlightMap[code] ?? 0

  return [
    hasBit(bitmask, 0),
    hasBit(bitmask, 1),
    hasBit(bitmask, 2),
    hasBit(bitmask, 3),
  ] as const
}
