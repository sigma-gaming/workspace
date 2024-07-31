export const DICE_RTP = 0.95

function calculateMultiplier(sides: number[]) {
  const uniqueSides = new Set(sides)
  return (6 / uniqueSides.size) * DICE_RTP
}

export function calculateDiceWinAmount(bet: number, sides: number[]) {
  const multiplier = calculateMultiplier(sides)
  return Math.ceil(bet * multiplier - bet)
}

export function calculateDiceFullWinAmount(bet: number, sides: number[]) {
  const multiplier = calculateMultiplier(sides)
  return Math.ceil(bet * multiplier)
}
