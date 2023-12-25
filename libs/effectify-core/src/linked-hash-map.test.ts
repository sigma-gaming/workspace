import { beforeEach, describe, expect, it } from 'vitest'
import { createLinkedHashMap, LinkedHashMap } from './linked-hash-map'

let list: LinkedHashMap<number>

beforeEach(() => {
  list = createLinkedHashMap<number>()

  list.push('1', 1)
  list.push('2', 2)
})

describe('LinkedList', () => {
  it('should initialize correctly', () => {
    const list = createLinkedHashMap<number>()

    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
  })

  it('should push correctly', () => {
    const list = createLinkedHashMap<number>()

    list.push('1', 1)
    expect(list.length).toBe(1)
    expect(list.start).toBe(1)
    expect(list.end).toBe(1)

    list.push('2', 2)
    expect(list.length).toBe(2)
    expect(list.start).toBe(1)
    expect(list.end).toBe(2)
  })

  it('should unshift correctly', () => {
    const list = createLinkedHashMap<number>()

    list.unshift('1', 1)
    expect(list.length).toBe(1)
    expect(list.start).toBe(1)
    expect(list.end).toBe(1)

    list.unshift('2', 2)
    expect(list.length).toBe(2)
    expect(list.start).toBe(2)
    expect(list.end).toBe(1)
  })

  it('should remove duplicate nodes on push and unshift', () => {
    list.push('1', 3)
    expect(list.length).toBe(2)
    expect(list.start).toBe(2)
    expect(list.end).toBe(3)

    list.unshift('2', 4)
    expect(list.length).toBe(2)
    expect(list.start).toBe(4)
    expect(list.end).toBe(3)
  })

  it('should pop correctly', () => {
    expect(list.pop()).toBe(2)
    expect(list.length).toBe(1)
    expect(list.start).toBe(1)
    expect(list.end).toBe(1)
    expect(list.pop()).toBe(1)
    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
    expect(list.pop()).toBe(null)
    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
  })

  it('should shift correctly', () => {
    expect(list.shift()).toBe(1)
    expect(list.length).toBe(1)
    expect(list.start).toBe(2)
    expect(list.end).toBe(2)
    expect(list.shift()).toBe(2)
    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
    expect(list.shift()).toBe(null)
    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
  })

  it('should find correctly', () => {
    expect(list.find((value) => value === 2)).toBe(2)
    expect(list.find((value) => value === 3)).toBe(null)
  })

  it('should execute forEach correctly', () => {
    const values: number[] = []
    list.forEach((value) => values.push(value))

    expect(values).toEqual([1, 2])
  })

  it('should extract correctly', () => {
    list.push('3', 3)

    expect(list.extract('2')).toBe(2)
    expect(list.length).toBe(2)
    expect(list.start).toBe(1)
    expect(list.end).toBe(3)
    expect(list.extract('1')).toBe(1)
    expect(list.length).toBe(1)
    expect(list.start).toBe(3)
    expect(list.end).toBe(3)
    expect(list.extract('3')).toBe(3)
    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
    expect(list.extract('4')).toBe(null)
    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
  })

  it('should clear correctly', () => {
    list.clear()

    expect(list.length).toBe(0)
    expect(list.start).toBe(null)
    expect(list.end).toBe(null)
  })
})
