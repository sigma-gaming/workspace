import { createSingletonProxy } from '@core/di'
import { singleton } from 'tsyringe-neo'

@singleton()
export class FraudService {
  
}

export const fraudService = createSingletonProxy(FraudService)
