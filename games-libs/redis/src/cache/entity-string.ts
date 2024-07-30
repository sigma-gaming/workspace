import { autoInjectable } from 'tsyringe-neo'
import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base'

@autoInjectable()
export class GlobalStringEntityService extends GlobalEntityBaseService<string> {
  parse = (value: string) => value
  stringify = (value: string) => value
}

@autoInjectable()
export class KeyStringEntityService extends KeyEntityBaseService<string> {
  parse = (value: string) => value
  stringify = (value: string) => value
}
