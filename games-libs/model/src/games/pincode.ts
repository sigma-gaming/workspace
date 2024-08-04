/* eslint-disable no-bitwise */
export enum PincodeMode {
  Easy = 'easy',
  Hardcore = 'hardcore',
}

type PincodeConfig = {
  [Mode in PincodeMode]: {
    multiplierMap: Partial<Record<number, number>>
    highlightMap: Partial<Record<number, number>>
    combinationMap: Partial<Record<number, string>>
  }
}

const config: PincodeConfig = {
  easy: {
    multiplierMap: {
      1111: 69,
      2222: 69,
      3333: 69,
      4444: 69,
      5555: 69,
      8888: 69,
      0: 100,
      9999: 100,
      1234: 123,
      4321: 321,
      1337: 337,
      1488: 488,
      6666: 666,
      7777: 777,
    },
    highlightMap: {
      1111: 15,
      2222: 15,
      3333: 15,
      4444: 15,
      5555: 15,
      8888: 15,
      0: 15,
      9999: 15,
      1234: 15,
      4321: 15,
      1337: 15,
      1488: 15,
      6666: 15,
      7777: 15,
    },
    combinationMap: {
      0: '0000',
      1111: '1111',
      2222: '2222',
      3333: '3333',
      4444: '4444',
      5555: '5555',
      6666: '6666',
      7777: '7777',
      8888: '8888',
      9999: '9999',
      1337: '1337',
      1488: '1488',
    },
  },
  hardcore: {
    multiplierMap: {
      1111: 69,
      2222: 69,
      3333: 69,
      4444: 69,
      5555: 69,
      8888: 69,
      0: 100,
      9999: 100,
      1234: 123,
      4321: 321,
      1337: 337,
      1488: 488,
      6666: 666,
      7777: 777,
    },
    highlightMap: {
      1111: 15,
      2222: 15,
      3333: 15,
      4444: 15,
      5555: 15,
      8888: 15,
      0: 15,
      9999: 15,
      1234: 15,
      4321: 15,
      1337: 15,
      1488: 15,
      6666: 15,
      7777: 15,
    },
    combinationMap: {
      0: '0000',
      1111: '1111',
      2222: '2222',
      3333: '3333',
      4444: '4444',
      5555: '5555',
      6666: '6666',
      7777: '7777',
      8888: '8888',
      9999: '9999',
      1337: '1337',
      1488: '1488',
    },
  },
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

  if (sevenCount === 2) {
    multiplier = 7
    config.hardcore.combinationMap[code] = `2x7`
  }

  if (sevenCount === 3) {
    multiplier = 77
    config.hardcore.combinationMap[code] = `3x7`
  }

  if (multiplier > 0) {
    config.hardcore.multiplierMap[code] = multiplier
    config.hardcore.highlightMap[code] = highlightBitmask
  }
}

export function getPincodeMultiplier(mode: PincodeMode, code: number) {
  return config[mode].multiplierMap[code] ?? 0
}

export function getPincodeHighlight(mode: PincodeMode, code: number) {
  const bitmask = config[mode].highlightMap[code] ?? 0

  return [
    hasBit(bitmask, 0),
    hasBit(bitmask, 1),
    hasBit(bitmask, 2),
    hasBit(bitmask, 3),
  ] as const
}

export function getPincodeCombination(mode: PincodeMode, code: number) {
  return config[mode].combinationMap[code] ?? null
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const __ = {
  config,
}
