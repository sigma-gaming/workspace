export const DICE_RTP = 0.95

export function calculateDiceWinAmount(bet: number, sides: number[]) {
  const uniqueSides = new Set(sides)
  const multiplier = (6 / uniqueSides.size) * DICE_RTP
  return Math.ceil(bet * multiplier - bet)
}
