import { Constructable, InjectionToken, isNormalToken } from './injection-token'
import { Lifecycle } from './lifecycle'
import {
  isFactoryProvider,
  isProvider,
  isTokenProvider,
  isValueProvider,
} from './providers/guards'
import {
  ClassProvider,
  FactoryProvider,
  Provider,
  TokenProvider,
  ValueProvider,
} from './providers/types'
import { Registration, RegistrationOptions, Registry } from './registry'

export class ResolutionContext {
  scopedResolutions: Map<Registration, any> = new Map()
}

export class Container {
  private registry = new Registry<Registration>()

  register<T>(token: InjectionToken<T>, provider: ValueProvider<T>): Container

  register<T>(token: InjectionToken<T>, provider: FactoryProvider<T>): Container

  register<T>(
    token: InjectionToken<T>,
    provider: TokenProvider<T>,
    options?: RegistrationOptions,
  ): Container

  register<T>(
    token: InjectionToken<T>,
    provider: ClassProvider<T>,
    options?: RegistrationOptions,
  ): Container

  register<T>(
    token: InjectionToken<T>,
    provider: Constructable<T>,
    options?: RegistrationOptions,
  ): Container

  register<T>(
    token: InjectionToken<T>,
    providerOrConstructor: Provider<T> | Constructable<T>,
    options: RegistrationOptions = { lifecycle: Lifecycle.Singleton },
  ): Container {
    let provider: Provider<T>

    if (!isProvider(providerOrConstructor)) {
      provider = { useClass: providerOrConstructor }
    } else {
      provider = providerOrConstructor
    }

    // Search the token graph for cycles
    if (isTokenProvider(provider)) {
      const path = [token]

      let tokenProvider: TokenProvider<T> | null = provider

      while (tokenProvider != null) {
        const currentToken: InjectionToken = tokenProvider.useToken

        if (path.includes(currentToken)) {
          throw new Error(
            `Token registration cycle detected! ${[...path, currentToken].join(
              ' -> ',
            )}`,
          )
        }

        path.push(currentToken)

        const registration = this.registry.get(currentToken)

        if (registration && isTokenProvider(registration.provider)) {
          tokenProvider = registration.provider
        } else {
          tokenProvider = null
        }
      }
    }

    if (
      options.lifecycle === Lifecycle.Singleton &&
      (isValueProvider(provider) || isFactoryProvider(provider))
    ) {
      throw new Error(
        `Cannot use lifecycle "${options.lifecycle}" with ValueProviders or FactoryProviders`,
      )
    }

    this.registry.set(token, { provider, options })

    return this
  }

  registerSingleton<T>(
    from: InjectionToken<T>,
    to?: InjectionToken<T>,
  ): Container {
    if (isNormalToken(from)) {
      if (isNormalToken(to)) {
        return this.register(
          from,
          {
            useToken: to,
          },
          { lifecycle: Lifecycle.Singleton },
        )
      }
      if (to) {
        return this.register(
          from,
          {
            useClass: to,
          },
          { lifecycle: Lifecycle.Singleton },
        )
      }

      throw new Error(
        'Cannot register a type name as a singleton without a "to" token',
      )
    }

    let useClass = from

    if (to && !isNormalToken(to)) {
      useClass = to
    }

    return this.register(
      from,
      {
        useClass,
      },
      { lifecycle: Lifecycle.Singleton },
    )
  }

  resolve<T>(
    token: InjectionToken<T>,
    context: ResolutionContext = new ResolutionContext(),
  ): T {
    const registration = this.getRegistration(token)

    if (!registration && isNormalToken(token)) {
      throw new Error(
        `Attempted to resolve unregistered dependency token: "${token.toString()}"`,
      )
    }

    this.executePreResolutionInterceptor<T>(token, 'Single')

    if (registration) {
      const result = this.resolveRegistration(registration, context) as T
      this.executePostResolutionInterceptor(token, result, 'Single')
      return result
    }

    // No registration for this token, but since it's a constructor, return an instance
    if (isConstructorToken(token)) {
      const result = this.construct(token, context)
      this.executePostResolutionInterceptor(token, result, 'Single')
      return result
    }

    throw new Error(
      'Attempted to construct an undefined constructor. Could mean a circular dependency problem. Try using `delay` function.',
    )
  }

  private executePreResolutionInterceptor<T>(
    token: InjectionToken<T>,
    resolutionType: ResolutionType,
  ): void {
    if (this.interceptors.preResolution.has(token)) {
      const remainingInterceptors = []
      for (const interceptor of this.interceptors.preResolution.getAll(token)) {
        if (interceptor.options.frequency !== 'Once') {
          remainingInterceptors.push(interceptor)
        }
        interceptor.callback(token, resolutionType)
      }

      this.interceptors.preResolution.setAll(token, remainingInterceptors)
    }
  }

  private executePostResolutionInterceptor<T>(
    token: InjectionToken<T>,
    result: T | T[],
    resolutionType: ResolutionType,
  ): void {
    if (this.interceptors.postResolution.has(token)) {
      const remainingInterceptors = []
      for (const interceptor of this.interceptors.postResolution.getAll(
        token,
      )) {
        if (interceptor.options.frequency !== 'Once') {
          remainingInterceptors.push(interceptor)
        }
        interceptor.callback(token, result, resolutionType)
      }

      this.interceptors.postResolution.setAll(token, remainingInterceptors)
    }
  }

  private resolveRegistration<T>(
    registration: Registration,
    context: ResolutionContext,
  ): T {
    const isSingleton = registration.options.lifecycle === Lifecycle.Singleton
    const isContainerScoped =
      registration.options.lifecycle === Lifecycle.ContainerScoped

    const returnInstance = isSingleton || isContainerScoped

    let newResolution = true
    let resolved: T

    if (isValueProvider(registration.provider)) {
      resolved = registration.provider.useValue
    } else if (isTokenProvider(registration.provider)) {
      newResolution = returnInstance
      resolved = returnInstance
        ? registration.instance ||
          (registration.instance = this.resolve(
            registration.provider.useToken,
            context,
          ))
        : this.resolve(registration.provider.useToken, context)
    } else if (isClassProvider(registration.provider)) {
      newResolution = returnInstance
      resolved = returnInstance
        ? registration.instance ||
          (registration.instance = this.construct(
            registration.provider.useClass,
            context,
          ))
        : this.construct(registration.provider.useClass, context)
    } else if (isFactoryProvider(registration.provider)) {
      resolved = registration.provider.useFactory(this)
    } else {
      newResolution = false
      resolved = this.construct(registration.provider, context)
    }

    // If this is a scoped dependency, store resolved instance in context
    if (registration.options.lifecycle === Lifecycle.ResolutionScoped) {
      context.scopedResolutions.set(registration, resolved)
    }

    // If this is a new resolution and the instance is disposable, add it to our set of disposables
    if (newResolution && isDisposable(resolved)) {
      this.disposables.add(resolved)
    }

    return resolved
  }
}
