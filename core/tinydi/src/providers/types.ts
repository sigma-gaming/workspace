import { Container } from '../container'
import { Constructable, InjectionToken } from '../injection-token'

export type ClassProvider<T> = {
  useClass: Constructable<T>
}

export type FactoryProvider<T> = {
  useFactory: (container: Container) => T
}

export type TokenProvider<T> = {
  useToken: InjectionToken<T>
}

export type ValueProvider<T> = {
  useValue: T
}

export type Provider<T = any> =
  | ClassProvider<T>
  | ValueProvider<T>
  | TokenProvider<T>
  | FactoryProvider<T>
