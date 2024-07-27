const staticMultiplierMap: Partial<Record<number, number>> = {
  0: 250,
  1111: 250,
  1337: 111,
  1488: 111,
  2222: 250,
  3333: 250,
  4444: 250,
  5555: 250,
  6666: 250,
  7777: 250,
  8888: 250,
  9999: 250,
}

type Highlight = [boolean, boolean, boolean, boolean]

type PincodeCalculation = {
  multiplier: number
  highlight: Highlight
}

const emptyHighlight: Highlight = [false, false, false, false]

export function calculatePincode(code: number): PincodeCalculation {
  const staticMultiplier = staticMultiplierMap[code]

  if (staticMultiplier)
    return {
      multiplier: staticMultiplier,
      highlight: [true, true, true, true],
    }

  let sevenCount = 0
  const highlight: Highlight = [false, false, false, false]
  const codeString = code.toString().padStart(4, '0')

  for (let i = 0; i < 4; i++) {
    if (codeString[i] === '7') {
      sevenCount += 1
      highlight[i] = true
    }
  }

  let multiplier = 0
  if (sevenCount === 2) multiplier = 5
  if (sevenCount === 3) multiplier = 100

  if (multiplier > 0) {
    return { multiplier, highlight }
  }

  return { multiplier: 0, highlight: emptyHighlight }
}
