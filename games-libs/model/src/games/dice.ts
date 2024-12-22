export const DICE_RTP = 0.95

export function calculateDiceMultiplier(sides: Set<number>) {
  return (6 / sides.size) * DICE_RTP
}

export function calculateDiceWinAmount(
  bet: number,
  sides: Set<number>,
  multiplier = calculateDiceMultiplier(sides),
) {
  return Math.ceil(bet * multiplier - bet)
}

export function calculateDiceFullWinAmount(bet: number, sides: Set<number>) {
  const multiplier = calculateDiceMultiplier(sides)
  return Math.ceil(bet * multiplier)
}
