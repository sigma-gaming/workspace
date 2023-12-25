import { TemplateParts } from './server-types'

export function prepareTemplate(options: {
  template: string
  slots: string[]
  htmlSlot: string
}): TemplateParts {
  const { template, slots, htmlSlot } = options
  const indexedSlots = []

  for (const slot of slots) {
    const index = template.indexOf(slot)
    indexedSlots.push({ index, slot })
  }

  const sortedSlots = indexedSlots
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((indexed) => indexed.slot)

  let current = template
  let htmlFound = false
  let start = ''
  const before = []
  const after = []

  for (const slot of sortedSlots) {
    const [left, right] = current.split(slot)

    if (!right) {
      continue
    }

    if (htmlFound) {
      after.pop()
      after.push(left, slot, right)
    } else if (slot === htmlSlot) {
      htmlFound = true
      before.push(left)
    } else if (!start) {
      start = left
      before.push(slot)
    } else {
      before.push(left, slot)
    }

    current = right
  }

  return {
    slots,
    start,
    before: before.filter(Boolean),
    after: after.filter(Boolean),
  }
}
