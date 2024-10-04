export const PINCODE_RTP = 0.95

/* eslint-disable no-bitwise */
export enum PincodeMode {
  Easy = 'easy',
  Hardcore = 'hardcore',
}

type PincodeConfig = {
  [Mode in PincodeMode]: {
    combinationMap: Partial<Record<number, string>>
    multiplierMap: Partial<Record<string, number>>
    highlightMap: Partial<Record<number, number>>
  }
}

const config: PincodeConfig = {
  easy: {
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
      1234: '1234',
      4321: '4321',
    },
    multiplierMap: {
      '2x0': 2,
      '2x9': 2,
      '2x7': 5,
      '3xN': 10,
      '3x7': 14,
      '1111': 50,
      '2222': 50,
      '3333': 50,
      '4444': 50,
      '5555': 50,
      '8888': 50,
      '6666': 66,
      '0000': 100,
      '9999': 100,
      '1234': 111,
      '4321': 111,
      '1337': 137,
      '1488': 148,
      '7777': 345,
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
  },
  hardcore: {
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
      1234: '1234',
      4321: '4321',
    },
    multiplierMap: {
      '2x7': 7,
      '3x7': 77,
      '1111': 69,
      '2222': 69,
      '3333': 69,
      '4444': 69,
      '5555': 69,
      '8888': 69,
      '0000': 100,
      '9999': 100,
      '1234': 123,
      '4321': 321,
      '1337': 337,
      '1488': 488,
      '6666': 666,
      '7777': 777,
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

function markNumbers(bitmask: number, codeString: string, number: number) {
  let result = bitmask

  for (let i = 0; i < 4; i++) {
    if (codeString[i] === String(number)) {
      result = withBit(result, i)
    }
  }

  return result
}

function setCombination(mode: PincodeMode, code: number, combination: string) {
  const current = getPincodeCombination(mode, code)

  if (current === null) {
    config[mode].combinationMap[code] = combination
    return
  }

  const oldMultiplier = config[mode].multiplierMap[current] ?? 0
  const newMultiplier = config[mode].multiplierMap[combination] ?? 0

  if (newMultiplier >= oldMultiplier) {
    config[mode].combinationMap[code] = combination
  }
}

for (let code = 0; code < 10000; code++) {
  const codeString = code.toString().padStart(4, '0')
  const countMap = new Map<string, number>()

  for (let i = 0; i < 4; i++) {
    const current = countMap.get(codeString[i]) ?? 0
    countMap.set(codeString[i], current + 1)
  }

  if (countMap.get('0') === 2) {
    setCombination(PincodeMode.Easy, code, `2x0`)
    config.easy.highlightMap[code] = markNumbers(0, codeString, 0)
  }

  if (countMap.get('9') === 2) {
    setCombination(PincodeMode.Easy, code, `2x9`)
    config.easy.highlightMap[code] = markNumbers(0, codeString, 9)
  }

  if (countMap.get('7') === 2) {
    setCombination(PincodeMode.Hardcore, code, '2x7')
    setCombination(PincodeMode.Easy, code, '2x7')
    config.hardcore.highlightMap[code] = markNumbers(0, codeString, 7)
    config.easy.highlightMap[code] = markNumbers(0, codeString, 7)
  }

  for (const [number, count] of countMap) {
    if (count === 3) {
      setCombination(PincodeMode.Easy, code, `3xN`)

      config.easy.highlightMap[code] = markNumbers(
        0,
        codeString,
        Number(number),
      )
    }
  }

  if (countMap.get('7') === 3) {
    setCombination(PincodeMode.Easy, code, '3x7')
    setCombination(PincodeMode.Hardcore, code, `3x7`)
    config.hardcore.highlightMap[code] = markNumbers(0, codeString, 7)
    config.easy.highlightMap[code] = markNumbers(0, codeString, 7)
  }
}

export function getPincodeCombination(mode: PincodeMode, code: number) {
  return config[mode].combinationMap[code] ?? null
}

export function getPincodeMultiplier(mode: PincodeMode, code: number) {
  const combination = getPincodeCombination(mode, code)
  if (combination === null) return 0
  return config[mode].multiplierMap[combination] ?? 0
}

export function getPincodeMultiplierMap(mode: PincodeMode) {
  return config[mode].multiplierMap
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const __ = {
  config,
}
