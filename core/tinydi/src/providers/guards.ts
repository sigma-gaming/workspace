import {
  ClassProvider,
  FactoryProvider,
  Provider,
  TokenProvider,
  ValueProvider,
} from './types'

export function isClassProvider<T>(
  provider: Provider<T>,
): provider is ClassProvider<any> {
  return 'useClass' in provider
}

export function isFactoryProvider<T>(
  provider: Provider<T>,
): provider is FactoryProvider<any> {
  return Boolean((provider as FactoryProvider<T>).useFactory)
}

export function isTokenProvider<T>(
  provider: Provider<T>,
): provider is TokenProvider<any> {
  return Boolean((provider as TokenProvider<T>).useToken)
}

export function isValueProvider<T>(
  provider: Provider<T>,
): provider is ValueProvider<T> {
  return Object.prototype.hasOwnProperty.call(provider, 'useValue')
}

export function isProvider(provider: any): provider is Provider {
  return (
    isClassProvider(provider) ||
    isValueProvider(provider) ||
    isTokenProvider(provider) ||
    isFactoryProvider(provider)
  )
}
