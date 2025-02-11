import { serializator } from '../serialization.js'
import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base.js'

export class GlobalJsonEntityService<T> extends GlobalEntityBaseService<T> {
  parse = serializator.parse
  stringify = serializator.stringify
}

export class KeyJsonEntityService<T> extends KeyEntityBaseService<T> {
  parse = serializator.parse
  stringify = serializator.stringify
}
