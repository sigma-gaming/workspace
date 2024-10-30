import { InjectionToken } from './injection-token'
import { Lifecycle } from './lifecycle'
import { Provider } from './providers/types'

export type RegistrationOptions = {
  lifecycle: Lifecycle
}

export type Registration<T = any> = {
  provider: Provider<T>
  options: RegistrationOptions
  instance?: T
}

export class Registry<T> {
  private map = new Map<InjectionToken, T[]>()

  private ensure(key: InjectionToken): void {
    if (!this.map.has(key)) {
      this.map.set(key, [])
    }
  }

  entries(): IterableIterator<[InjectionToken, T[]]> {
    return this.map.entries()
  }

  getAll(key: InjectionToken): T[] {
    this.ensure(key)
    return this.map.get(key)!
  }

  get(key: InjectionToken): T | null {
    this.ensure(key)
    const value = this.map.get(key)!
    return value[value.length - 1] || null
  }

  set(key: InjectionToken, value: T): void {
    this.ensure(key)
    this.map.get(key)!.push(value)
  }

  setAll(key: InjectionToken, value: T[]): void {
    this.map.set(key, value)
  }

  has(key: InjectionToken): boolean {
    this.ensure(key)
    return this.map.get(key)!.length > 0
  }

  clear(): void {
    this.map.clear()
  }

  delete(key: InjectionToken): void {
    this.map.delete(key)
  }
}
