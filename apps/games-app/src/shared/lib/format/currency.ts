const formatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
})

export function formatRUB(number: number) {
  return formatter.format(number)
}
