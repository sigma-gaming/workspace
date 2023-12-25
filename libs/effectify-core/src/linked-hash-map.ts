interface LinkedHashMapNode<T> {
  key: string
  value: T
  left: LinkedHashMapNode<T> | null
  right: LinkedHashMapNode<T> | null
}

export interface LinkedHashMap<T> {
  start: T | null
  end: T | null
  length: number
  get: (key: string) => T | null
  push: (key: string, value: T) => void
  unshift: (key: string, value: T) => void
  pop: () => T | null
  shift: () => T | null
  find: (fn: (value: T) => boolean) => T | null
  forEach: (fn: (value: T) => void) => void
  extract: (key: string) => T | null
  clear: () => void
}

export function createLinkedHashMap<T>(): LinkedHashMap<T> {
  const map = new Map<string, LinkedHashMapNode<T>>()
  let start: LinkedHashMapNode<T> | null = null
  let end: LinkedHashMapNode<T> | null = null
  let length = 0

  function get(key: string) {
    const node = map.get(key)
    return node?.value ?? null
  }

  function push(key: string, value: T) {
    const old = map.get(key)
    if (old) extract(key)
    const node: LinkedHashMapNode<T> = { key, value, left: start, right: null }
    map.set(key, node)
    if (end) end.right = node
    if (!start) start = node
    end = node
    length += 1
  }

  function unshift(key: string, value: T) {
    const old = map.get(key)
    if (old) extract(key)
    const node: LinkedHashMapNode<T> = { key, value, left: null, right: start }
    map.set(key, node)
    if (start) start.left = node
    if (!end) end = node
    start = node
    length += 1
  }

  function pop(): T | null {
    if (!end) return null
    const node = end
    if (end.left) end.left.right = null
    end = end.left
    if (node === start) start = null
    map.delete(node.key)
    length -= 1
    return node.value
  }

  function shift(): T | null {
    if (!start) return null
    const node = start
    if (start.right) start.right.left = null
    start = start.right
    if (node === end) end = null
    map.delete(node.key)
    length -= 1
    return node.value
  }

  function find(fn: (value: T) => boolean): T | null {
    let node = start

    while (node) {
      const is = fn(node.value)
      if (is) return node.value
      node = node.right
    }

    return null
  }

  function forEach(fn: (value: T) => void) {
    let node = start

    while (node) {
      fn(node.value)
      node = node.right
    }
  }

  function extract(key: string): T | null {
    const node = map.get(key)
    if (!node) return null
    if (node.left) node.left.right = node.right
    if (node.right) node.right.left = node.left
    if (node === start) start = node.right
    if (node === end) end = node.left
    map.delete(key)
    length -= 1
    return node.value
  }

  function clear() {
    start = null
    end = null
    length = 0
  }

  return {
    get start() {
      return start?.value ?? null
    },
    get end() {
      return end?.value ?? null
    },
    get length() {
      return length
    },
    get,
    push,
    pop,
    shift,
    unshift,
    find,
    forEach,
    extract,
    clear,
  }
}
