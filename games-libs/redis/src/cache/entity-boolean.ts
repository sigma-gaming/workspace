import { autoInjectable } from 'tsyringe-neo'
import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base'

@autoInjectable()
export class GlobalBooleanEntityService extends GlobalEntityBaseService<boolean> {
  parse = (value: string) => value === 'true'
  stringify = (value: boolean) => String(value)
}

@autoInjectable()
export class KeyBooleanEntityService extends KeyEntityBaseService<boolean> {
  parse = (value: string) => value === 'true'
  stringify = (value: boolean) => String(value)
}
