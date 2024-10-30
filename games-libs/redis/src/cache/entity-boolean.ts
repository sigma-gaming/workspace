import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base'

export class GlobalBooleanEntityService extends GlobalEntityBaseService<boolean> {
  parse = (value: string) => value === 'true'
  stringify = (value: boolean) => String(value)
}

export class KeyBooleanEntityService extends KeyEntityBaseService<boolean> {
  parse = (value: string) => value === 'true'
  stringify = (value: boolean) => String(value)
}
