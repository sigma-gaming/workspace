import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base.js'

export class GlobalStringEntityService extends GlobalEntityBaseService<string> {
  parse = (value: string) => value
  stringify = (value: string) => value
}

export class KeyStringEntityService extends KeyEntityBaseService<string> {
  parse = (value: string) => value
  stringify = (value: string) => value
}
