const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

export function formatGem(number: number | bigint) {
  return formatter.format(number)
}
